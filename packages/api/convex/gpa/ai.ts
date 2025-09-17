'use node';
import { ConvexError, v } from 'convex/values';
import OpenAI from 'openai';
import pdfParse from 'pdf-parse';
import { api } from '../_generated/api';
import { action } from '../_generated/server';

export interface ExtractedCourseInfoType {
  name: string | null;
  code: string | null;
  semester: string | null;
  year: number | null;
  confidence: {
    name: number;
    code: number;
    semester: number;
    year: number;
  };
}

export interface ExtractedAssignmentType {
  name: string;
  dueDate: string | null;
  weight: number;
  category: string | null;
  maxPoints: number | null;
}

export interface ExtractionResultType {
  courseInfo: ExtractedCourseInfoType;
  assignments: ExtractedAssignmentType[];
  count: number;
}

export const extractAssignments = action({
  args: { courseId: v.id('courses'), autoProcess: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError('Not authenticated');
    }

    const course = await ctx.runQuery(api.gpa.courses.getCourseById, {
      courseId: args.courseId,
    });
    if (!course) {
      throw new ConvexError('Course not found or access denied');
    }

    // Check if this course has syllabus data
    if (!course.syllabiFileId) {
      throw new ConvexError('No syllabus attached to this course');
    }

    // Download the file
    const fileBuffer = await ctx.storage.get(course.syllabiFileId);
    if (!fileBuffer) {
      throw new ConvexError('File not found');
    }

    // Convert buffer to text (support both TXT and PDF files)
    const fileName = course.syllabiFileName || '';
    let text = '';
    const arrayBuffer = await fileBuffer.arrayBuffer();

    // Get file extension from the filename
    const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';

    if (fileExtension === 'txt') {
      // Process TXT file
      text = new TextDecoder('utf-8').decode(arrayBuffer);
    } else if (fileExtension === 'pdf') {
      try {
        // Process PDF file using pdf-parse
        const buffer = Buffer.from(arrayBuffer);
        const pdfData = await pdfParse(buffer, {
          // Limit parsing to first few pages to avoid issues with large files
          max: 50,
        });
        text = pdfData.text;
      } catch (error) {
        console.error('Error parsing PDF:', error);
        throw new ConvexError(
          `Error parsing PDF: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    } else {
      throw new ConvexError(
        `File type '${fileExtension}' is not supported. Currently only txt and pdf files are supported for AI extraction.`
      );
    }

    // Process the text with OpenAI to extract course information and assignments
    const openai = new OpenAI({
      apiKey: process.env.CONVEX_OPENAI_API_KEY,
    });

    // Prepare the prompt for OpenAI
    const prompt = `
    You are an assistant that extracts information from a course syllabus.
    Given the following syllabus text, extract:
    
    1. Course name (full name of the course)
    2. Course code (e.g., CS101, MATH201)
    3. Semester (Fall, Spring, Summer)
    4. Year (e.g., 2025)
    5. Assignment information, including:
       - name
       - dueDate (YYYY-MM-DD format)
       - weight (as a number, 0-100)
       - category (e.g., exam, homework, project)
       - maxPoints (if available)
    
    For any field where the information isn't clearly specified, use null.
    
    Syllabus text:
    ${text.slice(0, 8000)} // Limit text to avoid token limits
    
    Respond ONLY with a JSON object with the following structure:
    {
      "courseInfo": {
        "name": "Course Name",
        "code": "CODE101",
        "semester": "Fall",
        "year": 2025,
        "confidence": {
          "name": 0.95,
          "code": 0.98,
          "semester": 0.85,
          "year": 0.9
        }
      },
      "assignments": [
        {
          "name": "Midterm Exam",
          "dueDate": "2025-10-15",
          "weight": 30,
          "category": "exam",
          "maxPoints": 100
        },
        ...
      ]
    }
    `;

    // Call OpenAI API and parse the response
    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-nano',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that extracts structured data from syllabi.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.2, // Lower temperature for more consistent results
    });

    // Parse the response
    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new ConvexError('No response from OpenAI');
    }

    // Extract the JSON from the response
    const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new ConvexError('Could not extract JSON from OpenAI response');
    }

    // Parse the JSON
    let extractionResult: ExtractionResultType;
    try {
      extractionResult = JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Error parsing JSON from OpenAI response:', error);
      throw new ConvexError(
        `Failed to parse JSON from OpenAI response: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    // Validate the extraction result
    if (!extractionResult.courseInfo || !extractionResult.assignments) {
      console.error('Invalid extraction result structure:', extractionResult);
      throw new ConvexError('Invalid extraction result structure from OpenAI');
    }

    const courseInfo = extractionResult.courseInfo;
    const assignments = extractionResult.assignments;

    // Determine if we should automatically save to DB or just return the extracted data
    const autoProcess = args.autoProcess ?? false;

    if (autoProcess) {
      // Update syllabus with extracted course info if confidence is high enough
      if (
        (courseInfo.name && courseInfo.confidence.name > 0.7) ||
        (courseInfo.code && courseInfo.confidence.code > 0.7)
      ) {
        const updateData: Record<string, any> = {};

        if (courseInfo.name && courseInfo.confidence.name > 0.7) {
          updateData.courseName = courseInfo.name;
        }

        if (courseInfo.code && courseInfo.confidence.code > 0.7) {
          updateData.courseCode = courseInfo.code;
        }

        if (courseInfo.semester && courseInfo.confidence.semester > 0.7) {
          updateData.semester = courseInfo.semester;
        }

        if (courseInfo.year && courseInfo.confidence.year > 0.7) {
          updateData.year = courseInfo.year;
        }

        if (Object.keys(updateData).length > 0) {
          await ctx.runMutation(api.gpa.courses.updateSyllabusInfo, {
            courseId: args.courseId,
            ...updateData,
          });
        }
      }

      // Save assignments
      await ctx.runMutation(api.gpa.courses.processSyllabus, {
        courseId: args.courseId,
        assignments: assignments.map(a => ({
          name: a.name,
          dueDate: a.dueDate ? a.dueDate : undefined,
          weight: a.weight,
          category: a.category ? a.category : undefined,
          maxPoints: a.maxPoints ? a.maxPoints : undefined,
        })),
      });
    }

    return {
      courseInfo: courseInfo,
      assignments: assignments,
      count: assignments.length,
    };
  },
});
