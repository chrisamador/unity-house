└── convex
    ├── ai.ts
    ├── auth.config.ts
    ├── auth.ts
    ├── grades.ts
    ├── http.ts
    ├── router.ts
    ├── schema.ts
    ├── syllabi.ts
    ├── tsconfig.json
    └── users.ts


/convex/ai.ts:
--------------------------------------------------------------------------------
  1 | "use node";
  2 | import { v } from "convex/values";
  3 | import { action } from "./_generated/server";
  4 | import { getAuthUserId } from "@convex-dev/auth/server";
  5 | import OpenAI from "openai";
  6 | import { api } from "./_generated/api";
  7 | import pdf from 'pdf-parse';
  8 | import { ConvexError } from "convex/values";
  9 | 
 10 | const logger = (...args: any[]) => console.log(`[extractAssignments]`, ...args);
 11 | 
 12 | export interface ExtractedCourseInfo {
 13 |   name: string | null;
 14 |   code: string | null;
 15 |   semester: string | null;
 16 |   year: number | null;
 17 |   confidence: {
 18 |     name: number;
 19 |     code: number;
 20 |     semester: number;
 21 |     year: number;
 22 |   };
 23 | }
 24 | 
 25 | export interface ExtractedAssignment {
 26 |   name: string;
 27 |   dueDate: string | null;
 28 |   weight: number;
 29 |   category: string | null;
 30 |   maxPoints: number | null;
 31 | }
 32 | 
 33 | export interface ExtractionResult {
 34 |   courseInfo: ExtractedCourseInfo;
 35 |   assignments: ExtractedAssignment[];
 36 |   count: number;
 37 | }
 38 | 
 39 | export const extractAssignments = action({
 40 |   args: { syllabusId: v.id("syllabi"), autoProcess: v.optional(v.boolean()) },
 41 |   handler: async (ctx, args) => {
 42 |     logger(`Starting extraction for syllabus ID: ${args.syllabusId}`);
 43 |     const userId = await getAuthUserId(ctx);
 44 |     if (!userId) {
 45 |       logger(`Authentication failed for request`);
 46 |       throw new ConvexError("Not authenticated");
 47 |     }
 48 |     logger(`Authenticated user: ${userId}`);
 49 | 
 50 |     const syllabus = await ctx.runQuery(api.syllabi.getSyllabusById, { syllabusId: args.syllabusId });
 51 |     if (!syllabus || syllabus.userId !== userId) {
 52 |       logger(`Syllabus not found or access denied. SyllabusId: ${args.syllabusId}, UserId: ${userId}`);
 53 |       throw new ConvexError("Syllabus not found or access denied");
 54 |     }
 55 |     logger(`Retrieved syllabus: ${syllabus._id}, filename: ${syllabus.fileName}`);
 56 | 
 57 |     // Download the file
 58 |     logger(`Downloading file with ID: ${syllabus.fileId}`);
 59 |     const fileBuffer = await ctx.storage.get(syllabus.fileId);
 60 |     if (!fileBuffer) {
 61 |       logger(`File not found with ID: ${syllabus.fileId}`);
 62 |       throw new ConvexError("File not found");
 63 |     }
 64 |     logger(`File downloaded successfully`);
 65 | 
 66 |     // Convert buffer to text (support both TXT and PDF files)
 67 |     const fileName = syllabus.fileName || "";
 68 |     let text = "";
 69 |     const arrayBuffer = await fileBuffer.arrayBuffer();
 70 |     
 71 |     if (fileName.toLowerCase().endsWith(".txt")) {
 72 |       // Process TXT file
 73 |       logger(`Processing TXT file: ${fileName}`);
 74 |       text = new TextDecoder("utf-8").decode(arrayBuffer);
 75 |       logger(`TXT file processed, extracted ${text.length} characters`);
 76 |     } else if (fileName.toLowerCase().endsWith(".pdf")) {
 77 |       // Process PDF file
 78 |       logger(`Processing PDF file: ${fileName}`);
 79 |       try {
 80 |         // Convert ArrayBuffer to Buffer for pdf-parse
 81 |         const buffer = Buffer.from(arrayBuffer);
 82 |         logger(`Created buffer for PDF parsing, size: ${buffer.length} bytes`);
 83 |         const pdfData = await pdf(buffer);
 84 |         text = pdfData.text;
 85 |         logger(`PDF file processed, extracted ${text.length} characters, ${pdfData.numpages} pages`);
 86 |       } catch (error) {
 87 |         logger(`PDF parsing error:`, error);
 88 |         throw new ConvexError(`Failed to parse PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
 89 |       }
 90 |     } else {
 91 |       logger(`Unsupported file format: ${fileName}`);
 92 |       throw new ConvexError("Currently only .txt and .pdf files are supported for AI extraction.");
 93 |     }
 94 | 
 95 |     // Call OpenAI to extract assignments
 96 |     logger(`Initializing OpenAI client to extract assignments`);
 97 |     const openai = new OpenAI({
 98 |       baseURL: process.env.CONVEX_OPENAI_BASE_URL,
 99 |       apiKey: process.env.CONVEX_OPENAI_API_KEY,
100 |     });
101 | 
102 |     const prompt = `
103 | You are an assistant that extracts information from a course syllabus.
104 | Given the following syllabus text, extract:
105 | 
106 | 1. Course name (full name of the course)
107 | 2. Course code (e.g., CS101, MATH201)
108 | 3. Semester (Fall, Spring, Summer)
109 | 4. Year (e.g., 2025)
110 | 5. Assignment information, including:
111 |    - name
112 |    - dueDate (YYYY-MM-DD format)
113 |    - weight (as a number, 0-100)
114 |    - category (e.g., exam, homework, project)
115 |    - maxPoints (if available)
116 | 
117 | For any field where the information isn't clearly specified, use null.
118 | 
119 | Syllabus text:
120 | ${text}
121 | 
122 | Respond ONLY with a JSON object with the following structure:
123 | {
124 |   "courseInfo": {
125 |     "name": "Course Name",
126 |     "code": "CODE101",
127 |     "semester": "Fall",
128 |     "year": 2025,
129 |     "confidence": {
130 |       "name": 0.95,
131 |       "code": 0.98,
132 |       "semester": 0.85,
133 |       "year": 0.9
134 |     }
135 |   },
136 |   "assignments": [
137 |     {
138 |       "name": "Midterm Exam",
139 |       "dueDate": "2025-10-15",
140 |       "weight": 30,
141 |       "category": "exam",
142 |       "maxPoints": 100
143 |     },
144 |     ...
145 |   ]
146 | }
147 | `;
148 | 
149 |     logger(`Sending request to OpenAI, text length: ${text.length} characters`);
150 |     const completion = await openai.chat.completions.create({
151 |       model: "gpt-4.1-nano",
152 |       messages: [{ role: "user", content: prompt }],
153 |       max_tokens: 1500,
154 |       temperature: 0,
155 |     });
156 |     logger(`Received response from OpenAI, response length: ${completion.choices[0].message.content?.length || 0} characters`);
157 | 
158 |     let extractedData: { courseInfo?: ExtractedCourseInfo; assignments?: ExtractedAssignment[] } = {};
159 |     try {
160 |       logger(`Parsing AI response to extract course info and assignments`);
161 |       // Try to parse the first code block as JSON
162 |       const match = completion.choices[0].message.content?.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
163 |       const jsonString = match ? match[1] : completion.choices[0].message.content;
164 |       logger(`Extracted JSON string from AI response, length: ${jsonString?.length || 0} characters`);
165 |       extractedData = JSON.parse(jsonString || "{}")
166 |       logger(`Successfully parsed extraction result. Course info: ${extractedData.courseInfo ? 'present' : 'missing'}, Assignments: ${extractedData.assignments?.length || 0}`);
167 |     } catch (e) {
168 |       logger(`Failed to parse extraction result from AI response:`, e);
169 |       throw new ConvexError("Failed to parse extraction result from AI response.");
170 |     }
171 |     
172 |     // Initialize with default values if missing
173 |     const courseInfo: ExtractedCourseInfo = extractedData.courseInfo || {
174 |       name: null,
175 |       code: null,
176 |       semester: null,
177 |       year: null,
178 |       confidence: { name: 0, code: 0, semester: 0, year: 0 }
179 |     };
180 |     
181 |     const assignments: ExtractedAssignment[] = extractedData.assignments || [];
182 | 
183 |     // Process assignments
184 |     const processedAssignments = assignments.map((a) => ({
185 |       name: a.name || "Untitled",
186 |       dueDate: a.dueDate || undefined, // Convert null to undefined for compatibility
187 |       weight: typeof a.weight === "number" ? a.weight : 0,
188 |       category: a.category || undefined, // Convert null to undefined for compatibility
189 |       maxPoints: typeof a.maxPoints === "number" ? a.maxPoints : undefined,
190 |     }));
191 |     
192 |     // Determine if we should automatically save to DB or just return the extracted data
193 |     const autoProcess = args.autoProcess ?? false;
194 |     
195 |     if (autoProcess) {
196 |       logger(`Automatically saving ${assignments.length} assignments to database for syllabus: ${args.syllabusId}`);
197 |       
198 |       // Update syllabus with extracted course info if confidence is high enough
199 |       if (courseInfo.name && courseInfo.confidence.name > 0.7 || 
200 |           courseInfo.code && courseInfo.confidence.code > 0.7) {
201 |         
202 |         const updateData: Record<string, any> = {};
203 |         
204 |         if (courseInfo.name && courseInfo.confidence.name > 0.7) {
205 |           updateData.courseName = courseInfo.name;
206 |         }
207 |         
208 |         if (courseInfo.code && courseInfo.confidence.code > 0.7) {
209 |           updateData.courseCode = courseInfo.code;
210 |         }
211 |         
212 |         if (courseInfo.semester && courseInfo.confidence.semester > 0.7) {
213 |           updateData.semester = courseInfo.semester;
214 |         }
215 |         
216 |         if (courseInfo.year && courseInfo.confidence.year > 0.7) {
217 |           updateData.year = courseInfo.year;
218 |         }
219 |         
220 |         if (Object.keys(updateData).length > 0) {
221 |           logger(`Updating syllabus with extracted course info: ${JSON.stringify(updateData)}`);
222 |           await ctx.runMutation(api.syllabi.updateSyllabusInfo, {
223 |             syllabusId: args.syllabusId,
224 |             ...updateData
225 |           });
226 |         }
227 |       }
228 |       
229 |       // Save assignments
230 |       await ctx.runMutation(api.syllabi.processSyllabus, {
231 |         syllabusId: args.syllabusId,
232 |         assignments: processedAssignments,
233 |       });
234 |       
235 |       logger(`Successfully saved ${assignments.length} assignments to database for syllabus: ${args.syllabusId}`);
236 |     } else {
237 |       logger(`Returning extracted data without saving to database`);
238 |     }
239 |     
240 |     return {
241 |       courseInfo,
242 |       assignments: processedAssignments,
243 |       count: assignments.length
244 |     };
245 |   },
246 | });
247 | 


--------------------------------------------------------------------------------
/convex/auth.config.ts:
--------------------------------------------------------------------------------
1 | export default {
2 |   providers: [
3 |     {
4 |       domain: process.env.CONVEX_SITE_URL,
5 |       applicationID: "convex",
6 |     },
7 |   ],
8 | };
9 | 


--------------------------------------------------------------------------------
/convex/auth.ts:
--------------------------------------------------------------------------------
 1 | import { convexAuth, getAuthUserId } from "@convex-dev/auth/server";
 2 | import { Password } from "@convex-dev/auth/providers/Password";
 3 | import { Anonymous } from "@convex-dev/auth/providers/Anonymous";
 4 | import { query } from "./_generated/server";
 5 | 
 6 | export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
 7 |   providers: [Password, Anonymous],
 8 | });
 9 | 
10 | export const loggedInUser = query({
11 |   handler: async (ctx) => {
12 |     const userId = await getAuthUserId(ctx);
13 |     if (!userId) {
14 |       return null;
15 |     }
16 |     const user = await ctx.db.get(userId);
17 |     if (!user) {
18 |       return null;
19 |     }
20 |     return user;
21 |   },
22 | });
23 | 


--------------------------------------------------------------------------------
/convex/grades.ts:
--------------------------------------------------------------------------------
  1 | import { v } from "convex/values";
  2 | import { query, mutation } from "./_generated/server";
  3 | import { getAuthUserId } from "@convex-dev/auth/server";
  4 | 
  5 | export const addGrade = mutation({
  6 |   args: {
  7 |     assignmentId: v.id("assignments"),
  8 |     pointsEarned: v.number(),
  9 |     maxPoints: v.number(),
 10 |   },
 11 |   handler: async (ctx, args) => {
 12 |     const userId = await getAuthUserId(ctx);
 13 |     if (!userId) throw new Error("Not authenticated");
 14 | 
 15 |     const assignment = await ctx.db.get(args.assignmentId);
 16 |     if (!assignment || assignment.userId !== userId) {
 17 |       throw new Error("Assignment not found or access denied");
 18 |     }
 19 | 
 20 |     const percentage = (args.pointsEarned / args.maxPoints) * 100;
 21 | 
 22 |     // Check if grade already exists
 23 |     const existingGrade = await ctx.db
 24 |       .query("grades")
 25 |       .withIndex("by_assignment", (q) => q.eq("assignmentId", args.assignmentId))
 26 |       .filter((q) => q.eq(q.field("userId"), userId))
 27 |       .unique();
 28 | 
 29 |     if (existingGrade) {
 30 |       // Update existing grade
 31 |       await ctx.db.patch(existingGrade._id, {
 32 |         pointsEarned: args.pointsEarned,
 33 |         maxPoints: args.maxPoints,
 34 |         percentage,
 35 |         enteredAt: Date.now(),
 36 |       });
 37 |       return existingGrade._id;
 38 |     } else {
 39 |       // Create new grade
 40 |       return await ctx.db.insert("grades", {
 41 |         assignmentId: args.assignmentId,
 42 |         userId,
 43 |         pointsEarned: args.pointsEarned,
 44 |         maxPoints: args.maxPoints,
 45 |         percentage,
 46 |         enteredAt: Date.now(),
 47 |       });
 48 |     }
 49 |   },
 50 | });
 51 | 
 52 | export const getUserGrades = query({
 53 |   args: {},
 54 |   handler: async (ctx) => {
 55 |     const userId = await getAuthUserId(ctx);
 56 |     if (!userId) return [];
 57 | 
 58 |     const grades = await ctx.db
 59 |       .query("grades")
 60 |       .withIndex("by_user", (q) => q.eq("userId", userId))
 61 |       .collect();
 62 | 
 63 |     return await Promise.all(
 64 |       grades.map(async (grade) => {
 65 |         const assignment = await ctx.db.get(grade.assignmentId);
 66 |         const syllabus = assignment ? await ctx.db.get(assignment.syllabusId) : null;
 67 |         return {
 68 |           ...grade,
 69 |           assignment,
 70 |           syllabus,
 71 |         };
 72 |       })
 73 |     );
 74 |   },
 75 | });
 76 | 
 77 | export const calculateUserGPA = query({
 78 |   args: {},
 79 |   handler: async (ctx) => {
 80 |     const userId = await getAuthUserId(ctx);
 81 |     if (!userId) return { gpa: 0, totalCredits: 0 };
 82 | 
 83 |     const courses = await ctx.db
 84 |       .query("courses")
 85 |       .withIndex("by_user", (q) => q.eq("userId", userId))
 86 |       .collect();
 87 | 
 88 |     let totalGradePoints = 0;
 89 |     let totalCredits = 0;
 90 | 
 91 |     for (const course of courses) {
 92 |       // Get all assignments for this course
 93 |       const syllabi = await ctx.db
 94 |         .query("syllabi")
 95 |         .withIndex("by_course", (q) => 
 96 |           q.eq("courseCode", course.courseCode)
 97 |            .eq("semester", course.semester)
 98 |            .eq("year", course.year)
 99 |         )
100 |         .filter((q) => q.eq(q.field("userId"), userId))
101 |         .collect();
102 | 
103 |       if (syllabi.length === 0) continue;
104 | 
105 |       const syllabus = syllabi[0];
106 |       const assignments = await ctx.db
107 |         .query("assignments")
108 |         .withIndex("by_syllabus", (q) => q.eq("syllabusId", syllabus._id))
109 |         .collect();
110 | 
111 |       let courseWeightedScore = 0;
112 |       let totalWeight = 0;
113 | 
114 |       for (const assignment of assignments) {
115 |         const grade = await ctx.db
116 |           .query("grades")
117 |           .withIndex("by_assignment", (q) => q.eq("assignmentId", assignment._id))
118 |           .filter((q) => q.eq(q.field("userId"), userId))
119 |           .unique();
120 | 
121 |         if (grade) {
122 |           courseWeightedScore += grade.percentage * (assignment.weight / 100);
123 |           totalWeight += assignment.weight;
124 |         }
125 |       }
126 | 
127 |       if (totalWeight > 0) {
128 |         const courseGrade = courseWeightedScore / (totalWeight / 100);
129 |         const gradePoints = percentageToGradePoints(courseGrade);
130 |         totalGradePoints += gradePoints * course.creditHours;
131 |         totalCredits += course.creditHours;
132 |       }
133 |     }
134 | 
135 |     const gpa = totalCredits > 0 ? totalGradePoints / totalCredits : 0;
136 |     return { gpa: Math.round(gpa * 100) / 100, totalCredits };
137 |   },
138 | });
139 | 
140 | export const getSchoolAverageGPA = query({
141 |   args: {},
142 |   handler: async (ctx) => {
143 |     const userId = await getAuthUserId(ctx);
144 |     if (!userId) return { averageGPA: 0, totalStudents: 0 };
145 | 
146 |     // Get all undergraduate profiles
147 |     const undergraduates = await ctx.db
148 |       .query("userProfiles")
149 |       .withIndex("by_role", (q) => q.eq("role", "undergraduate"))
150 |       .filter((q) => q.eq(q.field("isApproved"), true))
151 |       .collect();
152 | 
153 |     let totalGPA = 0;
154 |     let studentsWithGPA = 0;
155 | 
156 |     for (const student of undergraduates) {
157 |       const courses = await ctx.db
158 |         .query("courses")
159 |         .withIndex("by_user", (q) => q.eq("userId", student.userId))
160 |         .collect();
161 | 
162 |       let studentTotalGradePoints = 0;
163 |       let studentTotalCredits = 0;
164 | 
165 |       for (const course of courses) {
166 |         const syllabi = await ctx.db
167 |           .query("syllabi")
168 |           .withIndex("by_course", (q) => 
169 |             q.eq("courseCode", course.courseCode)
170 |              .eq("semester", course.semester)
171 |              .eq("year", course.year)
172 |           )
173 |           .filter((q) => q.eq(q.field("userId"), student.userId))
174 |           .collect();
175 | 
176 |         if (syllabi.length === 0) continue;
177 | 
178 |         const syllabus = syllabi[0];
179 |         const assignments = await ctx.db
180 |           .query("assignments")
181 |           .withIndex("by_syllabus", (q) => q.eq("syllabusId", syllabus._id))
182 |           .collect();
183 | 
184 |         let courseWeightedScore = 0;
185 |         let totalWeight = 0;
186 | 
187 |         for (const assignment of assignments) {
188 |           const grade = await ctx.db
189 |             .query("grades")
190 |             .withIndex("by_assignment", (q) => q.eq("assignmentId", assignment._id))
191 |             .filter((q) => q.eq(q.field("userId"), student.userId))
192 |             .unique();
193 | 
194 |           if (grade) {
195 |             courseWeightedScore += grade.percentage * (assignment.weight / 100);
196 |             totalWeight += assignment.weight;
197 |           }
198 |         }
199 | 
200 |         if (totalWeight > 0) {
201 |           const courseGrade = courseWeightedScore / (totalWeight / 100);
202 |           const gradePoints = percentageToGradePoints(courseGrade);
203 |           studentTotalGradePoints += gradePoints * course.creditHours;
204 |           studentTotalCredits += course.creditHours;
205 |         }
206 |       }
207 | 
208 |       if (studentTotalCredits > 0) {
209 |         const studentGPA = studentTotalGradePoints / studentTotalCredits;
210 |         totalGPA += studentGPA;
211 |         studentsWithGPA++;
212 |       }
213 |     }
214 | 
215 |     const averageGPA = studentsWithGPA > 0 ? totalGPA / studentsWithGPA : 0;
216 |     return { 
217 |       averageGPA: Math.round(averageGPA * 100) / 100, 
218 |       totalStudents: studentsWithGPA 
219 |     };
220 |   },
221 | });
222 | 
223 | function percentageToGradePoints(percentage: number): number {
224 |   if (percentage >= 97) return 4.0;
225 |   if (percentage >= 93) return 3.7;
226 |   if (percentage >= 90) return 3.3;
227 |   if (percentage >= 87) return 3.0;
228 |   if (percentage >= 83) return 2.7;
229 |   if (percentage >= 80) return 2.3;
230 |   if (percentage >= 77) return 2.0;
231 |   if (percentage >= 73) return 1.7;
232 |   if (percentage >= 70) return 1.3;
233 |   if (percentage >= 67) return 1.0;
234 |   if (percentage >= 65) return 0.7;
235 |   return 0.0;
236 | }
237 | 


--------------------------------------------------------------------------------
/convex/http.ts:
--------------------------------------------------------------------------------
 1 | import { auth } from "./auth";
 2 | import router from "./router";
 3 | 
 4 | const http = router;
 5 | 
 6 | // We'll use a different approach to PDF embedding instead of HTTP handlers
 7 | // to avoid TypeScript compatibility issues
 8 | 
 9 | auth.addHttpRoutes(http);
10 | 
11 | export default http;
12 | 


--------------------------------------------------------------------------------
/convex/router.ts:
--------------------------------------------------------------------------------
1 | import { httpRouter } from "convex/server";
2 | 
3 | const http = httpRouter();
4 | 
5 | export default http;
6 | 


--------------------------------------------------------------------------------
/convex/schema.ts:
--------------------------------------------------------------------------------
 1 | import { defineSchema, defineTable } from "convex/server";
 2 | import { v } from "convex/values";
 3 | import { authTables } from "@convex-dev/auth/server";
 4 | 
 5 | const applicationTables = {
 6 |   // Extended user profiles
 7 |   userProfiles: defineTable({
 8 |     userId: v.id("users"),
 9 |     role: v.union(v.literal("admin"), v.literal("undergraduate")),
10 |     firstName: v.string(),
11 |     lastName: v.string(),
12 |     school: v.string(),
13 |     studentId: v.optional(v.string()), // Only for undergraduates
14 |     profilePicture: v.optional(v.id("_storage")),
15 |     isApproved: v.boolean(), // For admin approval
16 |   }).index("by_user_id", ["userId"])
17 |     .index("by_role", ["role"])
18 |     .index("by_school", ["school"]),
19 | 
20 |   // Syllabi uploaded by students
21 |   syllabi: defineTable({
22 |     userId: v.id("users"),
23 |     courseName: v.string(),
24 |     courseCode: v.string(),
25 |     semester: v.string(),
26 |     year: v.number(),
27 |     fileId: v.id("_storage"),
28 |     fileName: v.string(),
29 |     isProcessed: v.boolean(),
30 |     uploadedAt: v.number(),
31 |   }).index("by_user_id", ["userId"])
32 |     .index("by_course", ["courseCode", "semester", "year"]),
33 | 
34 |   // Assignments extracted from syllabi
35 |   assignments: defineTable({
36 |     syllabusId: v.id("syllabi"),
37 |     userId: v.id("users"),
38 |     name: v.string(),
39 |     dueDate: v.optional(v.string()),
40 |     weight: v.number(), // Percentage weight (0-100)
41 |     category: v.optional(v.string()), // e.g., "exam", "homework", "project"
42 |     maxPoints: v.optional(v.number()),
43 |   }).index("by_syllabus", ["syllabusId"])
44 |     .index("by_user", ["userId"]),
45 | 
46 |   // Grades entered by students
47 |   grades: defineTable({
48 |     assignmentId: v.id("assignments"),
49 |     userId: v.id("users"),
50 |     pointsEarned: v.number(),
51 |     maxPoints: v.number(),
52 |     percentage: v.number(),
53 |     enteredAt: v.number(),
54 |   }).index("by_assignment", ["assignmentId"])
55 |     .index("by_user", ["userId"]),
56 | 
57 |   // Course enrollments for GPA calculation
58 |   courses: defineTable({
59 |     userId: v.id("users"),
60 |     courseName: v.string(),
61 |     courseCode: v.string(),
62 |     semester: v.string(),
63 |     year: v.number(),
64 |     creditHours: v.number(),
65 |     currentGPA: v.optional(v.number()),
66 |   }).index("by_user", ["userId"])
67 |     .index("by_semester", ["semester", "year"]),
68 | };
69 | 
70 | export default defineSchema({
71 |   ...authTables,
72 |   ...applicationTables,
73 | });
74 | 


--------------------------------------------------------------------------------
/convex/syllabi.ts:
--------------------------------------------------------------------------------
  1 | import { v } from "convex/values";
  2 | import { query, mutation } from "./_generated/server";
  3 | import { getAuthUserId } from "@convex-dev/auth/server";
  4 | 
  5 | export const generateUploadUrl = mutation({
  6 |   args: {},
  7 |   handler: async (ctx) => {
  8 |     const userId = await getAuthUserId(ctx);
  9 |     if (!userId) throw new Error("Not authenticated");
 10 |     return await ctx.storage.generateUploadUrl();
 11 |   },
 12 | });
 13 | 
 14 | export const createSyllabus = mutation({
 15 |   args: {
 16 |     courseName: v.string(),
 17 |     courseCode: v.string(),
 18 |     semester: v.string(),
 19 |     year: v.number(),
 20 |     fileId: v.id("_storage"),
 21 |     fileName: v.string(),
 22 |   },
 23 |   handler: async (ctx, args) => {
 24 |     const userId = await getAuthUserId(ctx);
 25 |     if (!userId) throw new Error("Not authenticated");
 26 | 
 27 |     const syllabusId = await ctx.db.insert("syllabi", {
 28 |       userId,
 29 |       courseName: args.courseName,
 30 |       courseCode: args.courseCode,
 31 |       semester: args.semester,
 32 |       year: args.year,
 33 |       fileId: args.fileId,
 34 |       fileName: args.fileName,
 35 |       isProcessed: false,
 36 |       uploadedAt: Date.now(),
 37 |     });
 38 | 
 39 |     // Create a course entry
 40 |     await ctx.db.insert("courses", {
 41 |       userId,
 42 |       courseName: args.courseName,
 43 |       courseCode: args.courseCode,
 44 |       semester: args.semester,
 45 |       year: args.year,
 46 |       creditHours: 3, // Default, can be updated later
 47 |     });
 48 | 
 49 |     return syllabusId;
 50 |   },
 51 | });
 52 | 
 53 | export const getUserSyllabi = query({
 54 |   args: {},
 55 |   handler: async (ctx) => {
 56 |     const userId = await getAuthUserId(ctx);
 57 |     if (!userId) return [];
 58 | 
 59 |     const syllabi = await ctx.db
 60 |       .query("syllabi")
 61 |       .withIndex("by_user_id", (q) => q.eq("userId", userId))
 62 |       .order("desc")
 63 |       .collect();
 64 | 
 65 |     return await Promise.all(
 66 |       syllabi.map(async (syllabus) => ({
 67 |         ...syllabus,
 68 |         fileUrl: await ctx.storage.getUrl(syllabus.fileId),
 69 |       }))
 70 |     );
 71 |   },
 72 | });
 73 | 
 74 | export const getSyllabusById = query({
 75 |   args: { syllabusId: v.id("syllabi") },
 76 |   handler: async (ctx, args) => {
 77 |     return await ctx.db.get(args.syllabusId);
 78 |   },
 79 | });
 80 | 
 81 | export const updateSyllabusInfo = mutation({
 82 |   args: {
 83 |     syllabusId: v.id("syllabi"),
 84 |     courseName: v.optional(v.string()),
 85 |     courseCode: v.optional(v.string()),
 86 |     semester: v.optional(v.string()),
 87 |     year: v.optional(v.number()),
 88 |   },
 89 |   handler: async (ctx, args) => {
 90 |     const userId = await getAuthUserId(ctx);
 91 |     if (!userId) throw new Error("Not authenticated");
 92 | 
 93 |     const syllabus = await ctx.db.get(args.syllabusId);
 94 |     if (!syllabus || syllabus.userId !== userId) {
 95 |       throw new Error("Syllabus not found or access denied");
 96 |     }
 97 | 
 98 |     const updateData: Record<string, any> = {};
 99 |     if (args.courseName !== undefined) updateData.courseName = args.courseName;
100 |     if (args.courseCode !== undefined) updateData.courseCode = args.courseCode;
101 |     if (args.semester !== undefined) updateData.semester = args.semester;
102 |     if (args.year !== undefined) updateData.year = args.year;
103 | 
104 |     // Only update if we have something to update
105 |     if (Object.keys(updateData).length > 0) {
106 |       await ctx.db.patch(args.syllabusId, updateData);
107 | 
108 |       // Update related course if it exists
109 |       const course = await ctx.db
110 |         .query("courses")
111 |         .withIndex("by_user", (q) => q.eq("userId", userId))
112 |         .filter((q) => 
113 |           q.eq(q.field("courseCode"), syllabus.courseCode) &&
114 |           q.eq(q.field("semester"), syllabus.semester) &&
115 |           q.eq(q.field("year"), syllabus.year)
116 |         )
117 |         .first();
118 | 
119 |       if (course) {
120 |         const courseUpdateData: Record<string, any> = {};
121 |         if (args.courseName !== undefined) courseUpdateData.courseName = args.courseName;
122 |         if (args.courseCode !== undefined) courseUpdateData.courseCode = args.courseCode;
123 |         if (args.semester !== undefined) courseUpdateData.semester = args.semester;
124 |         if (args.year !== undefined) courseUpdateData.year = args.year;
125 | 
126 |         if (Object.keys(courseUpdateData).length > 0) {
127 |           await ctx.db.patch(course._id, courseUpdateData);
128 |         }
129 |       }
130 |     }
131 | 
132 |     return await ctx.db.get(args.syllabusId);
133 |   }
134 | });
135 | 
136 | export const processSyllabus = mutation({
137 |   args: {
138 |     syllabusId: v.id("syllabi"),
139 |     assignments: v.array(v.object({
140 |       name: v.string(),
141 |       dueDate: v.optional(v.string()),
142 |       weight: v.number(),
143 |       category: v.optional(v.string()),
144 |       maxPoints: v.optional(v.number()),
145 |     })),
146 |   },
147 |   handler: async (ctx, args) => {
148 |     const userId = await getAuthUserId(ctx);
149 |     if (!userId) throw new Error("Not authenticated");
150 | 
151 |     const syllabus = await ctx.db.get(args.syllabusId);
152 |     if (!syllabus || syllabus.userId !== userId) {
153 |       throw new Error("Syllabus not found or access denied");
154 |     }
155 | 
156 |     // Create assignments
157 |     for (const assignment of args.assignments) {
158 |       await ctx.db.insert("assignments", {
159 |         syllabusId: args.syllabusId,
160 |         userId,
161 |         name: assignment.name,
162 |         dueDate: assignment.dueDate,
163 |         weight: assignment.weight,
164 |         category: assignment.category,
165 |         maxPoints: assignment.maxPoints || 100,
166 |       });
167 |     }
168 | 
169 |     // Mark syllabus as processed
170 |     await ctx.db.patch(args.syllabusId, { isProcessed: true });
171 |   },
172 | });
173 | 
174 | export const getSyllabusAssignments = query({
175 |   args: { syllabusId: v.id("syllabi") },
176 |   handler: async (ctx, args) => {
177 |     const userId = await getAuthUserId(ctx);
178 |     if (!userId) return [];
179 | 
180 |     return await ctx.db
181 |       .query("assignments")
182 |       .withIndex("by_syllabus", (q) => q.eq("syllabusId", args.syllabusId))
183 |       .collect();
184 |   },
185 | });
186 | 


--------------------------------------------------------------------------------
/convex/tsconfig.json:
--------------------------------------------------------------------------------
 1 | {
 2 |   /* This TypeScript project config describes the environment that
 3 |    * Convex functions run in and is used to typecheck them.
 4 |    * You can modify it, but some settings required to use Convex.
 5 |    */
 6 |   "compilerOptions": {
 7 |     /* These settings are not required by Convex and can be modified. */
 8 |     "allowJs": true,
 9 |     "strict": true,
10 |     "moduleResolution": "Bundler",
11 |     "jsx": "react-jsx",
12 |     "skipLibCheck": true,
13 |     "allowSyntheticDefaultImports": true,
14 | 
15 |     /* These compiler options are required by Convex */
16 |     "target": "ESNext",
17 |     "lib": ["ES2021", "dom"],
18 |     "forceConsistentCasingInFileNames": true,
19 |     "module": "ESNext",
20 |     "isolatedModules": true,
21 |     "noEmit": true
22 |   },
23 |   "include": ["./**/*"],
24 |   "exclude": ["./_generated"]
25 | }
26 | 


--------------------------------------------------------------------------------
/convex/users.ts:
--------------------------------------------------------------------------------
  1 | import { v } from "convex/values";
  2 | import { query, mutation } from "./_generated/server";
  3 | import { getAuthUserId } from "@convex-dev/auth/server";
  4 | 
  5 | export const getCurrentUser = query({
  6 |   args: {},
  7 |   handler: async (ctx) => {
  8 |     const userId = await getAuthUserId(ctx);
  9 |     if (!userId) return null;
 10 | 
 11 |     const user = await ctx.db.get(userId);
 12 |     if (!user) return null;
 13 | 
 14 |     const profile = await ctx.db
 15 |       .query("userProfiles")
 16 |       .withIndex("by_user_id", (q) => q.eq("userId", userId))
 17 |       .unique();
 18 | 
 19 |     return { ...user, profile };
 20 |   },
 21 | });
 22 | 
 23 | export const createUserProfile = mutation({
 24 |   args: {
 25 |     role: v.union(v.literal("admin"), v.literal("undergraduate")),
 26 |     firstName: v.string(),
 27 |     lastName: v.string(),
 28 |     school: v.string(),
 29 |     studentId: v.optional(v.string()),
 30 |   },
 31 |   handler: async (ctx, args) => {
 32 |     const userId = await getAuthUserId(ctx);
 33 |     if (!userId) throw new Error("Not authenticated");
 34 | 
 35 |     // Check if profile already exists
 36 |     const existingProfile = await ctx.db
 37 |       .query("userProfiles")
 38 |       .withIndex("by_user_id", (q) => q.eq("userId", userId))
 39 |       .unique();
 40 | 
 41 |     if (existingProfile) {
 42 |       throw new Error("Profile already exists");
 43 |     }
 44 | 
 45 |     return await ctx.db.insert("userProfiles", {
 46 |       userId,
 47 |       role: args.role,
 48 |       firstName: args.firstName,
 49 |       lastName: args.lastName,
 50 |       school: args.school,
 51 |       studentId: args.studentId,
 52 |       isApproved: args.role === "undergraduate", // Auto-approve undergraduates
 53 |     });
 54 |   },
 55 | });
 56 | 
 57 | export const updateProfile = mutation({
 58 |   args: {
 59 |     firstName: v.optional(v.string()),
 60 |     lastName: v.optional(v.string()),
 61 |     school: v.optional(v.string()),
 62 |     studentId: v.optional(v.string()),
 63 |     profilePicture: v.optional(v.id("_storage")),
 64 |   },
 65 |   handler: async (ctx, args) => {
 66 |     const userId = await getAuthUserId(ctx);
 67 |     if (!userId) throw new Error("Not authenticated");
 68 | 
 69 |     const profile = await ctx.db
 70 |       .query("userProfiles")
 71 |       .withIndex("by_user_id", (q) => q.eq("userId", userId))
 72 |       .unique();
 73 | 
 74 |     if (!profile) throw new Error("Profile not found");
 75 | 
 76 |     const updates: any = {};
 77 |     if (args.firstName !== undefined) updates.firstName = args.firstName;
 78 |     if (args.lastName !== undefined) updates.lastName = args.lastName;
 79 |     if (args.school !== undefined) updates.school = args.school;
 80 |     if (args.studentId !== undefined) updates.studentId = args.studentId;
 81 |     if (args.profilePicture !== undefined) updates.profilePicture = args.profilePicture;
 82 | 
 83 |     await ctx.db.patch(profile._id, updates);
 84 |   },
 85 | });
 86 | 
 87 | export const getAllUsers = query({
 88 |   args: {},
 89 |   handler: async (ctx) => {
 90 |     const userId = await getAuthUserId(ctx);
 91 |     if (!userId) throw new Error("Not authenticated");
 92 | 
 93 |     const currentUserProfile = await ctx.db
 94 |       .query("userProfiles")
 95 |       .withIndex("by_user_id", (q) => q.eq("userId", userId))
 96 |       .unique();
 97 | 
 98 |     if (!currentUserProfile || currentUserProfile.role !== "admin") {
 99 |       throw new Error("Admin access required");
100 |     }
101 | 
102 |     const profiles = await ctx.db.query("userProfiles").collect();
103 |     const users = await Promise.all(
104 |       profiles.map(async (profile) => {
105 |         const user = await ctx.db.get(profile.userId);
106 |         return { ...user, profile };
107 |       })
108 |     );
109 | 
110 |     return users;
111 |   },
112 | });
113 | 
114 | export const approveUser = mutation({
115 |   args: { profileId: v.id("userProfiles") },
116 |   handler: async (ctx, args) => {
117 |     const userId = await getAuthUserId(ctx);
118 |     if (!userId) throw new Error("Not authenticated");
119 | 
120 |     const currentUserProfile = await ctx.db
121 |       .query("userProfiles")
122 |       .withIndex("by_user_id", (q) => q.eq("userId", userId))
123 |       .unique();
124 | 
125 |     if (!currentUserProfile || currentUserProfile.role !== "admin") {
126 |       throw new Error("Admin access required");
127 |     }
128 | 
129 |     await ctx.db.patch(args.profileId, { isApproved: true });
130 |   },
131 | });
132 | 


--------------------------------------------------------------------------------

└── src
    ├── App.tsx
    ├── SignInForm.tsx
    ├── SignOutButton.tsx
    ├── components
        ├── About.tsx
        ├── Dashboard.tsx
        ├── ExtractedDataEditor.tsx
        ├── GPADisplay.tsx
        ├── GradeEntry.tsx
        ├── ProfileSetup.tsx
        ├── SyllabusPreview.tsx
        ├── SyllabusUpload.tsx
        ├── ThemeToggle.tsx
        └── UserManagement.tsx
    └── main.tsx


/src/App.tsx:
--------------------------------------------------------------------------------
  1 | import { Authenticated, Unauthenticated, useQuery } from "convex/react";
  2 | import { api } from "../convex/_generated/api";
  3 | import { SignInForm } from "./SignInForm";
  4 | import { SignOutButton } from "./SignOutButton";
  5 | import { Toaster } from "sonner";
  6 | import { Dashboard } from "./components/Dashboard";
  7 | import { ProfileSetup } from "./components/ProfileSetup";
  8 | import { About } from "./components/About";
  9 | import { ThemeProvider } from "./contexts/ThemeContext";
 10 | import { ThemeToggle } from "./components/ThemeToggle";
 11 | import { useState } from "react";
 12 | 
 13 | interface ContentProps {
 14 |   currentPage: string;
 15 |   setCurrentPage: React.Dispatch<React.SetStateAction<string>>;
 16 | }
 17 | 
 18 | function Content({ currentPage, setCurrentPage }: ContentProps) {
 19 |   const currentUser = useQuery(api.users.getCurrentUser);
 20 | 
 21 |   if (currentUser === undefined) {
 22 |     return (
 23 |       <div className="flex justify-center items-center min-h-96">
 24 |         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
 25 |       </div>
 26 |     );
 27 |   }
 28 | 
 29 |   // Show About page regardless of authentication if it's selected
 30 |   if (currentPage === "about") {
 31 |     return <About />;
 32 |   }
 33 | 
 34 |   return (
 35 |     <>
 36 |       <Unauthenticated>
 37 |         <div className="max-w-md mx-auto mt-16 px-4">
 38 |           <div className="text-center mb-8">
 39 |             <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Welcome to DMV Lambdas</h2>
 40 |             <p className="text-gray-600 dark:text-gray-400">Your comprehensive academic management platform</p>
 41 |           </div>
 42 |           <SignInForm />
 43 |         </div>
 44 |       </Unauthenticated>
 45 | 
 46 |       <Authenticated>
 47 |         {currentUser && !currentUser.profile ? (
 48 |           <ProfileSetup />
 49 |         ) : currentUser?.profile?.isApproved ? (
 50 |           <Dashboard />
 51 |         ) : (
 52 |           <div className="max-w-2xl mx-auto mt-16 px-4 text-center">
 53 |             <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
 54 |               <h2 className="text-xl font-semibold text-yellow-800 dark:text-yellow-300 mb-2">Account Pending Approval</h2>
 55 |               <p className="text-yellow-700 dark:text-yellow-200">
 56 |                 Your account is waiting for administrator approval. You'll receive access once approved.
 57 |               </p>
 58 |             </div>
 59 |           </div>
 60 |         )}
 61 |       </Authenticated>
 62 |     </>
 63 |   );
 64 | }
 65 | 
 66 | export default function App() {
 67 |   const [currentPage, setCurrentPage] = useState("dashboard");
 68 |   
 69 |   return (
 70 |     <ThemeProvider>
 71 |       <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors">
 72 |         <header className="sticky top-0 z-10 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-b shadow-sm dark:border-gray-700 transition-colors">
 73 |           <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
 74 |             <div className="flex justify-between items-center h-16">
 75 |               <div className="flex items-center space-x-6">
 76 |                 <h1 className="text-2xl font-bold text-stone-600 dark:text-blue-400">DMV Lambdas | Academics</h1>
 77 |                 <nav className="hidden md:flex space-x-4">
 78 |                   <button
 79 |                     onClick={() => setCurrentPage("dashboard")}
 80 |                     className={`px-3 py-2 rounded-md text-sm font-medium ${currentPage === "dashboard" 
 81 |                       ? "text-blue-600 dark:text-blue-400"
 82 |                       : "text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400"}`}
 83 |                   >
 84 |                     Dashboard
 85 |                   </button>
 86 |                   <button
 87 |                     onClick={() => setCurrentPage("about")}
 88 |                     className={`px-3 py-2 rounded-md text-sm font-medium ${currentPage === "about" 
 89 |                       ? "text-blue-600 dark:text-blue-400"
 90 |                       : "text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400"}`}
 91 |                   >
 92 |                     About
 93 |                   </button>
 94 |                 </nav>
 95 |               </div>
 96 |               <div className="flex items-center space-x-4">
 97 |                 <ThemeToggle />
 98 |                 <Authenticated>
 99 |                   <SignOutButton />
100 |                 </Authenticated>
101 |               </div>
102 |             </div>
103 |           </div>
104 |         </header>
105 |         
106 |         <main className="flex-1">
107 |           <Content currentPage={currentPage} setCurrentPage={setCurrentPage} />
108 |         </main>
109 |         
110 |         <Toaster position="top-right" />
111 |       </div>
112 |     </ThemeProvider>
113 |   );
114 | }
115 | 


--------------------------------------------------------------------------------
/src/SignInForm.tsx:
--------------------------------------------------------------------------------
 1 | "use client";
 2 | import { useAuthActions } from "@convex-dev/auth/react";
 3 | import { useState } from "react";
 4 | import { toast } from "sonner";
 5 | 
 6 | export function SignInForm() {
 7 |   const { signIn } = useAuthActions();
 8 |   const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
 9 |   const [submitting, setSubmitting] = useState(false);
10 | 
11 |   return (
12 |     <div className="w-full">
13 |       <form
14 |         className="flex flex-col gap-form-field"
15 |         onSubmit={(e) => {
16 |           e.preventDefault();
17 |           setSubmitting(true);
18 |           const formData = new FormData(e.target as HTMLFormElement);
19 |           formData.set("flow", flow);
20 |           void signIn("password", formData).catch((error) => {
21 |             let toastTitle = "";
22 |             if (error.message.includes("Invalid password")) {
23 |               toastTitle = "Invalid password. Please try again.";
24 |             } else {
25 |               toastTitle =
26 |                 flow === "signIn"
27 |                   ? "Could not sign in, did you mean to sign up?"
28 |                   : "Could not sign up, did you mean to sign in?";
29 |             }
30 |             toast.error(toastTitle);
31 |             setSubmitting(false);
32 |           });
33 |         }}
34 |       >
35 |         <input
36 |           className="auth-input-field"
37 |           type="email"
38 |           name="email"
39 |           placeholder="Email"
40 |           required
41 |         />
42 |         <input
43 |           className="auth-input-field"
44 |           type="password"
45 |           name="password"
46 |           placeholder="Password"
47 |           required
48 |         />
49 |         <button className="auth-button" type="submit" disabled={submitting}>
50 |           {flow === "signIn" ? "Sign in" : "Sign up"}
51 |         </button>
52 |         <div className="text-center text-sm text-secondary">
53 |           <span>
54 |             {flow === "signIn"
55 |               ? "Don't have an account? "
56 |               : "Already have an account? "}
57 |           </span>
58 |           <button
59 |             type="button"
60 |             className="text-primary hover:text-primary-hover hover:underline font-medium cursor-pointer"
61 |             onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
62 |           >
63 |             {flow === "signIn" ? "Sign up instead" : "Sign in instead"}
64 |           </button>
65 |         </div>
66 |       </form>
67 |       <div className="flex items-center justify-center my-3">
68 |         <hr className="my-4 grow border-gray-200" />
69 |         <span className="mx-4 text-secondary">or</span>
70 |         <hr className="my-4 grow border-gray-200" />
71 |       </div>
72 |       <button className="auth-button" onClick={() => void signIn("anonymous")}>
73 |         Sign in anonymously
74 |       </button>
75 |     </div>
76 |   );
77 | }
78 | 


--------------------------------------------------------------------------------
/src/SignOutButton.tsx:
--------------------------------------------------------------------------------
 1 | "use client";
 2 | import { useAuthActions } from "@convex-dev/auth/react";
 3 | import { useConvexAuth } from "convex/react";
 4 | 
 5 | export function SignOutButton() {
 6 |   const { isAuthenticated } = useConvexAuth();
 7 |   const { signOut } = useAuthActions();
 8 | 
 9 |   if (!isAuthenticated) {
10 |     return null;
11 |   }
12 | 
13 |   return (
14 |     <button
15 |       className="px-4 py-2 rounded bg-white text-secondary border border-gray-200 font-semibold hover:bg-gray-50 hover:text-secondary-hover transition-colors shadow-sm hover:shadow"
16 |       onClick={() => void signOut()}
17 |     >
18 |       Sign out
19 |     </button>
20 |   );
21 | }
22 | 


--------------------------------------------------------------------------------
/src/components/About.tsx:
--------------------------------------------------------------------------------
 1 | import React from "react";
 2 | 
 3 | export const About = () => {
 4 |   return (
 5 |     <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
 6 |       <div className="text-center mb-8">
 7 |         <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
 8 |           About DMV Lambdas
 9 |         </h1>
10 |         <div className="w-20 h-1 bg-blue-600 dark:bg-blue-400 mx-auto mb-6"></div>
11 |       </div>
12 | 
13 |       <div className="prose dark:prose-invert max-w-none">
14 |         <section className="mb-8">
15 |           <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
16 |             Our Mission
17 |           </h2>
18 |           <p className="text-gray-600 dark:text-gray-300 mb-4">
19 |             DMV Lambdas is dedicated to supporting students in their academic journey by providing
20 |             a comprehensive platform for managing coursework, tracking academic performance, and
21 |             connecting with resources that enhance the educational experience.
22 |           </p>
23 |           <p className="text-gray-600 dark:text-gray-300">
24 |             We strive to empower students with tools that simplify academic management, allowing
25 |             them to focus on learning and growth.
26 |           </p>
27 |         </section>
28 | 
29 |         <section className="mb-8">
30 |           <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
31 |             What We Offer
32 |           </h2>
33 |           <div className="grid md:grid-cols-2 gap-6">
34 |             <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-100 dark:border-gray-700">
35 |               <h3 className="text-xl font-medium text-gray-800 dark:text-gray-100 mb-2">
36 |                 GPA Tracking
37 |               </h3>
38 |               <p className="text-gray-600 dark:text-gray-300">
39 |                 Easily monitor your academic performance with our intuitive GPA calculator and
40 |                 visualization tools.
41 |               </p>
42 |             </div>
43 |             <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-100 dark:border-gray-700">
44 |               <h3 className="text-xl font-medium text-gray-800 dark:text-gray-100 mb-2">
45 |                 Syllabus Management
46 |               </h3>
47 |               <p className="text-gray-600 dark:text-gray-300">
48 |                 Upload and extract key information from your course syllabi to stay organized
49 |                 throughout the semester.
50 |               </p>
51 |             </div>
52 |             <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-100 dark:border-gray-700">
53 |               <h3 className="text-xl font-medium text-gray-800 dark:text-gray-100 mb-2">
54 |                 Grade Entry
55 |               </h3>
56 |               <p className="text-gray-600 dark:text-gray-300">
57 |                 Record and track your course grades in one centralized location.
58 |               </p>
59 |             </div>
60 |             <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-100 dark:border-gray-700">
61 |               <h3 className="text-xl font-medium text-gray-800 dark:text-gray-100 mb-2">
62 |                 Academic Dashboard
63 |               </h3>
64 |               <p className="text-gray-600 dark:text-gray-300">
65 |                 Get a comprehensive overview of your academic progress with our customizable
66 |                 dashboard.
67 |               </p>
68 |             </div>
69 |           </div>
70 |         </section>
71 | 
72 |         <section>
73 |           <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
74 |             Contact Us
75 |           </h2>
76 |           <p className="text-gray-600 dark:text-gray-300 mb-4">
77 |             Have questions or feedback? We'd love to hear from you! Reach out to our team at:
78 |           </p>
79 |           <a
80 |             href="mailto:support@dmvlambdas.org"
81 |             className="text-blue-600 dark:text-blue-400 hover:underline"
82 |           >
83 |             support@dmvlambdas.org
84 |           </a>
85 |         </section>
86 |       </div>
87 |     </div>
88 |   );
89 | };
90 | 


--------------------------------------------------------------------------------
/src/components/Dashboard.tsx:
--------------------------------------------------------------------------------
 1 | import { useState } from "react";
 2 | import { useQuery } from "convex/react";
 3 | import { api } from "../../convex/_generated/api";
 4 | import { SyllabusUpload } from "./SyllabusUpload";
 5 | import { GradeEntry } from "./GradeEntry";
 6 | import { GPADisplay } from "./GPADisplay";
 7 | import { UserManagement } from "./UserManagement";
 8 | 
 9 | export function Dashboard() {
10 |   const currentUser = useQuery(api.users.getCurrentUser);
11 |   const [activeTab, setActiveTab] = useState("overview");
12 | 
13 |   if (!currentUser?.profile) return null;
14 | 
15 |   const isAdmin = currentUser.profile?.role === "admin";
16 |   const isUndergraduate = currentUser.profile?.role === "undergraduate";
17 | 
18 |   const tabs = [
19 |     { id: "overview", label: "Overview", roles: ["admin", "undergraduate"] },
20 |     { id: "syllabus", label: "Syllabi", roles: ["undergraduate"] },
21 |     { id: "grades", label: "Grades", roles: ["undergraduate"] },
22 |     { id: "users", label: "User Management", roles: ["admin"] },
23 |   ].filter(tab => tab.roles.includes(currentUser.profile?.role || ""));
24 | 
25 |   return (
26 |     <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-colors">
27 |       <div className="mb-8">
28 |         <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
29 |           Welcome, {currentUser.profile.firstName} {currentUser.profile.lastName}
30 |         </h1>
31 |         <p className="text-gray-600 dark:text-gray-400 mt-1">
32 |           {isAdmin ? "Administrator Dashboard" : `Student Dashboard`}
33 |         </p>
34 |       </div>
35 | 
36 |       {/* Tab Navigation */}
37 |       <div className="border-b border-gray-200 dark:border-gray-700 mb-8">
38 |         <nav className="-mb-px flex space-x-8">
39 |           {tabs.map((tab) => (
40 |             <button
41 |               key={tab.id}
42 |               onClick={() => setActiveTab(tab.id)}
43 |               className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
44 |                 activeTab === tab.id
45 |                   ? "border-blue-500 text-blue-600 dark:text-blue-400"
46 |                   : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
47 |               }`}
48 |             >
49 |               {tab.label}
50 |             </button>
51 |           ))}
52 |         </nav>
53 |       </div>
54 | 
55 |       {/* Tab Content */}
56 |       <div className="space-y-8">
57 |         {activeTab === "overview" && (
58 |           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
59 |             <GPADisplay />
60 |             {isUndergraduate && (
61 |               <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors">
62 |                 <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
63 |                 <div className="space-y-3">
64 |                   <button
65 |                     onClick={() => setActiveTab("syllabus")}
66 |                     className="w-full text-left p-3 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg transition-colors"
67 |                   >
68 |                     <div className="font-medium text-blue-900 dark:text-blue-300">Upload Syllabus</div>
69 |                     <div className="text-sm text-blue-700 dark:text-blue-400">Add a new course syllabus</div>
70 |                   </button>
71 |                   <button
72 |                     onClick={() => setActiveTab("grades")}
73 |                     className="w-full text-left p-3 bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50 rounded-lg transition-colors"
74 |                   >
75 |                     <div className="font-medium text-green-900 dark:text-green-300">Enter Grades</div>
76 |                     <div className="text-sm text-green-700 dark:text-green-400">Update your assignment grades</div>
77 |                   </button>
78 |                 </div>
79 |               </div>
80 |             )}
81 |           </div>
82 |         )}
83 | 
84 |         {activeTab === "syllabus" && isUndergraduate && <SyllabusUpload />}
85 |         {activeTab === "grades" && isUndergraduate && <GradeEntry />}
86 |         {activeTab === "users" && isAdmin && <UserManagement />}
87 |       </div>
88 |     </div>
89 |   );
90 | }
91 | 


--------------------------------------------------------------------------------
/src/components/ExtractedDataEditor.tsx:
--------------------------------------------------------------------------------
  1 | import { useState, useEffect } from 'react';
  2 | import type { ExtractedCourseInfo, ExtractedAssignment } from '../../convex/ai';
  3 | 
  4 | interface ExtractedDataEditorProps {
  5 |   courseInfo: ExtractedCourseInfo;
  6 |   assignments: ExtractedAssignment[];
  7 |   onCourseInfoChange: (info: ExtractedCourseInfo) => void;
  8 |   onAssignmentsChange: (assignments: ExtractedAssignment[]) => void;
  9 | }
 10 | 
 11 | export function ExtractedDataEditor({
 12 |   courseInfo,
 13 |   assignments,
 14 |   onCourseInfoChange,
 15 |   onAssignmentsChange,
 16 | }: ExtractedDataEditorProps) {
 17 |   const [activeTab, setActiveTab] = useState<'course' | 'assignments'>('course');
 18 |   const [editingAssignmentIndex, setEditingAssignmentIndex] = useState<number | null>(null);
 19 | 
 20 |   // Update course info handler
 21 |   const handleCourseInfoChange = <K extends keyof ExtractedCourseInfo>(
 22 |     field: K, 
 23 |     value: ExtractedCourseInfo[K]
 24 |   ) => {
 25 |     // Don't update confidence scores when directly editing fields
 26 |     onCourseInfoChange({
 27 |       ...courseInfo,
 28 |       [field]: value
 29 |     });
 30 |   };
 31 | 
 32 |   // Add new assignment handler
 33 |   const handleAddAssignment = () => {
 34 |     const newAssignment: ExtractedAssignment = {
 35 |       name: "New Assignment",
 36 |       dueDate: null,
 37 |       weight: 0,
 38 |       category: null,
 39 |       maxPoints: null
 40 |     };
 41 |     onAssignmentsChange([...assignments, newAssignment]);
 42 |     // Set the editing index to the new assignment
 43 |     setEditingAssignmentIndex(assignments.length);
 44 |     // Switch to assignments tab
 45 |     setActiveTab('assignments');
 46 |   };
 47 | 
 48 |   // Update assignment handler
 49 |   const handleAssignmentChange = (index: number, field: keyof ExtractedAssignment, value: any) => {
 50 |     const updatedAssignments = [...assignments];
 51 |     updatedAssignments[index] = { ...updatedAssignments[index], [field]: value };
 52 |     onAssignmentsChange(updatedAssignments);
 53 |   };
 54 | 
 55 |   // Delete assignment handler
 56 |   const handleDeleteAssignment = (index: number) => {
 57 |     const updatedAssignments = assignments.filter((_, i) => i !== index);
 58 |     onAssignmentsChange(updatedAssignments);
 59 |     setEditingAssignmentIndex(null);
 60 |   };
 61 | 
 62 |   // Reset editing state when assignments change externally
 63 |   useEffect(() => {
 64 |     if (editingAssignmentIndex !== null && editingAssignmentIndex >= assignments.length) {
 65 |       setEditingAssignmentIndex(null);
 66 |     }
 67 |   }, [assignments, editingAssignmentIndex]);
 68 | 
 69 |   return (
 70 |     <div className="bg-white border rounded-md shadow-sm">
 71 |       {/* Tabs */}
 72 |       <div className="border-b flex">
 73 |         <button
 74 |           className={`flex-1 py-3 font-medium ${
 75 |             activeTab === 'course'
 76 |               ? 'text-blue-600 border-b-2 border-blue-600'
 77 |               : 'text-gray-500 hover:text-gray-700'
 78 |           }`}
 79 |           onClick={() => setActiveTab('course')}
 80 |         >
 81 |           Course Details
 82 |         </button>
 83 |         <button
 84 |           className={`flex-1 py-3 font-medium ${
 85 |             activeTab === 'assignments'
 86 |               ? 'text-blue-600 border-b-2 border-blue-600'
 87 |               : 'text-gray-500 hover:text-gray-700'
 88 |           }`}
 89 |           onClick={() => setActiveTab('assignments')}
 90 |         >
 91 |           Assignments ({assignments.length})
 92 |         </button>
 93 |       </div>
 94 | 
 95 |       {/* Content */}
 96 |       <div className="p-4">
 97 |         {activeTab === 'course' ? (
 98 |           <div className="space-y-4">
 99 |             <h3 className="text-lg font-semibold text-gray-900">Course Information</h3>
100 |             <div className="space-y-3">
101 |               <div>
102 |                 <label htmlFor="courseName" className="block text-sm font-medium text-gray-700 mb-1">
103 |                   Course Name {courseInfo.confidence.name > 0 && (
104 |                     <span className="text-xs text-gray-500 ml-1">
105 |                       (Confidence: {Math.round(courseInfo.confidence.name * 100)}%)
106 |                     </span>
107 |                   )}
108 |                 </label>
109 |                 <input
110 |                   type="text"
111 |                   id="courseName"
112 |                   value={courseInfo.name || ''}
113 |                   onChange={(e) => handleCourseInfoChange('name', e.target.value)}
114 |                   className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
115 |                 />
116 |               </div>
117 |               <div>
118 |                 <label htmlFor="courseCode" className="block text-sm font-medium text-gray-700 mb-1">
119 |                   Course Code {courseInfo.confidence.code > 0 && (
120 |                     <span className="text-xs text-gray-500 ml-1">
121 |                       (Confidence: {Math.round(courseInfo.confidence.code * 100)}%)
122 |                     </span>
123 |                   )}
124 |                 </label>
125 |                 <input
126 |                   type="text"
127 |                   id="courseCode"
128 |                   value={courseInfo.code || ''}
129 |                   onChange={(e) => handleCourseInfoChange('code', e.target.value)}
130 |                   className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
131 |                 />
132 |               </div>
133 |               <div className="grid grid-cols-2 gap-3">
134 |                 <div>
135 |                   <label htmlFor="semester" className="block text-sm font-medium text-gray-700 mb-1">
136 |                     Semester {courseInfo.confidence.semester > 0 && (
137 |                       <span className="text-xs text-gray-500 ml-1">
138 |                         (Confidence: {Math.round(courseInfo.confidence.semester * 100)}%)
139 |                       </span>
140 |                     )}
141 |                   </label>
142 |                   <select
143 |                     id="semester"
144 |                     value={courseInfo.semester || ''}
145 |                     onChange={(e) => handleCourseInfoChange('semester', e.target.value)}
146 |                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
147 |                   >
148 |                     <option value="">Select Semester</option>
149 |                     <option value="Fall">Fall</option>
150 |                     <option value="Spring">Spring</option>
151 |                     <option value="Summer">Summer</option>
152 |                   </select>
153 |                 </div>
154 |                 <div>
155 |                   <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">
156 |                     Year {courseInfo.confidence.year > 0 && (
157 |                       <span className="text-xs text-gray-500 ml-1">
158 |                         (Confidence: {Math.round(courseInfo.confidence.year * 100)}%)
159 |                       </span>
160 |                     )}
161 |                   </label>
162 |                   <input
163 |                     type="number"
164 |                     id="year"
165 |                     value={courseInfo.year || ''}
166 |                     onChange={(e) => handleCourseInfoChange('year', parseInt(e.target.value) || null)}
167 |                     min="2020"
168 |                     max="2030"
169 |                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
170 |                   />
171 |                 </div>
172 |               </div>
173 |             </div>
174 |           </div>
175 |         ) : (
176 |           <div className="space-y-4">
177 |             <div className="flex justify-between items-center">
178 |               <h3 className="text-lg font-semibold text-gray-900">Assignments</h3>
179 |               <button
180 |                 onClick={handleAddAssignment}
181 |                 className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
182 |               >
183 |                 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
184 |                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
185 |                 </svg>
186 |                 Add Assignment
187 |               </button>
188 |             </div>
189 |             
190 |             {assignments.length === 0 ? (
191 |               <div className="text-center py-8 text-gray-500">
192 |                 <p>No assignments detected.</p>
193 |                 <button
194 |                   onClick={handleAddAssignment}
195 |                   className="mt-2 text-blue-600 hover:text-blue-800 font-medium"
196 |                 >
197 |                   Add an assignment manually
198 |                 </button>
199 |               </div>
200 |             ) : (
201 |               <div className="space-y-4">
202 |                 {/* Assignment list */}
203 |                 <div className="border rounded-md overflow-hidden">
204 |                   {assignments.sort((a, b) => new Date(a.dueDate ?? 0).getTime() - new Date(b.dueDate ?? 0).getTime()).map((assignment, index) => (
205 |                     <div
206 |                       key={index}
207 |                       className={`border-b last:border-b-0 p-3 hover:bg-gray-50 cursor-pointer ${
208 |                         editingAssignmentIndex === index ? 'bg-blue-50' : ''
209 |                       }`}
210 |                       onClick={() => setEditingAssignmentIndex(index)}
211 |                     >
212 |                       <div className="flex justify-between">
213 |                         <div>
214 |                           <h4 className="font-medium text-gray-900">{assignment.name}</h4>
215 |                           <div className="text-sm text-gray-600">
216 |                             {assignment.category && (
217 |                               <span className="mr-2">{assignment.category}</span>
218 |                             )}
219 |                             {assignment.dueDate && (
220 |                               <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
221 |                             )}
222 |                           </div>
223 |                         </div>
224 |                         <div className="text-right">
225 |                           <div className="font-medium">{assignment.weight}%</div>
226 |                           {assignment.maxPoints && (
227 |                             <div className="text-sm text-gray-600">{assignment.maxPoints} pts</div>
228 |                           )}
229 |                         </div>
230 |                       </div>
231 |                     </div>
232 |                   ))}
233 |                 </div>
234 | 
235 |                 {/* Assignment editor */}
236 |                 {editingAssignmentIndex !== null && (
237 |                   <div className="border rounded-md p-4 bg-gray-50">
238 |                     <h4 className="text-gray-900 font-medium mb-3">Edit Assignment</h4>
239 |                     <div className="space-y-3">
240 |                       <div>
241 |                         <label className="block text-sm font-medium text-gray-700 mb-1">
242 |                           Assignment Name
243 |                         </label>
244 |                         <input
245 |                           type="text"
246 |                           value={assignments[editingAssignmentIndex].name}
247 |                           onChange={(e) => handleAssignmentChange(editingAssignmentIndex, 'name', e.target.value)}
248 |                           className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
249 |                         />
250 |                       </div>
251 |                       <div className="grid grid-cols-2 gap-3">
252 |                         <div>
253 |                           <label className="block text-sm font-medium text-gray-700 mb-1">
254 |                             Category
255 |                           </label>
256 |                           <input
257 |                             type="text"
258 |                             value={assignments[editingAssignmentIndex].category || ''}
259 |                             onChange={(e) => handleAssignmentChange(editingAssignmentIndex, 'category', e.target.value || null)}
260 |                             placeholder="e.g., Exam, Homework"
261 |                             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
262 |                           />
263 |                         </div>
264 |                         <div>
265 |                           <label className="block text-sm font-medium text-gray-700 mb-1">
266 |                             Due Date
267 |                           </label>
268 |                           <input
269 |                             type="date"
270 |                             value={assignments[editingAssignmentIndex].dueDate || ''}
271 |                             onChange={(e) => handleAssignmentChange(editingAssignmentIndex, 'dueDate', e.target.value || null)}
272 |                             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
273 |                           />
274 |                         </div>
275 |                       </div>
276 |                       <div className="grid grid-cols-2 gap-3">
277 |                         <div>
278 |                           <label className="block text-sm font-medium text-gray-700 mb-1">
279 |                             Weight (%)
280 |                           </label>
281 |                           <input
282 |                             type="number"
283 |                             value={assignments[editingAssignmentIndex].weight}
284 |                             onChange={(e) => handleAssignmentChange(editingAssignmentIndex, 'weight', parseFloat(e.target.value) || 0)}
285 |                             min="0"
286 |                             max="100"
287 |                             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
288 |                           />
289 |                         </div>
290 |                         <div>
291 |                           <label className="block text-sm font-medium text-gray-700 mb-1">
292 |                             Max Points
293 |                           </label>
294 |                           <input
295 |                             type="number"
296 |                             value={assignments[editingAssignmentIndex].maxPoints || ''}
297 |                             onChange={(e) => handleAssignmentChange(editingAssignmentIndex, 'maxPoints', parseInt(e.target.value) || null)}
298 |                             min="0"
299 |                             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
300 |                           />
301 |                         </div>
302 |                       </div>
303 |                       <div className="pt-2 flex justify-end">
304 |                         <button
305 |                           onClick={() => handleDeleteAssignment(editingAssignmentIndex)}
306 |                           className="text-red-600 hover:text-red-800 text-sm font-medium"
307 |                         >
308 |                           Delete Assignment
309 |                         </button>
310 |                       </div>
311 |                     </div>
312 |                   </div>
313 |                 )}
314 |               </div>
315 |             )}
316 |           </div>
317 |         )}
318 |       </div>
319 |     </div>
320 |   );
321 | }
322 | 


--------------------------------------------------------------------------------
/src/components/GPADisplay.tsx:
--------------------------------------------------------------------------------
 1 | import { useQuery } from "convex/react";
 2 | import { api } from "../../convex/_generated/api";
 3 | 
 4 | export function GPADisplay() {
 5 |   const currentUser = useQuery(api.users.getCurrentUser);
 6 |   const userGPA = useQuery(api.grades.calculateUserGPA);
 7 |   const schoolGPA = useQuery(api.grades.getSchoolAverageGPA);
 8 | 
 9 |   const isAdmin = currentUser?.profile?.role === "admin";
10 | 
11 |   return (
12 |     <div className="bg-white rounded-lg shadow-md p-6">
13 |       <h2 className="text-xl font-semibold text-gray-900 mb-6">
14 |         {isAdmin ? "School Statistics" : "Academic Performance"}
15 |       </h2>
16 |       
17 |       <div className="space-y-6">
18 |         {!isAdmin && userGPA && (
19 |           <div className="text-center">
20 |             <div className="text-4xl font-bold text-blue-600 mb-2">
21 |               {userGPA.gpa.toFixed(2)}
22 |             </div>
23 |             <div className="text-gray-600">Your Current GPA</div>
24 |             <div className="text-sm text-gray-500 mt-1">
25 |               Based on {userGPA.totalCredits} credit hours
26 |             </div>
27 |           </div>
28 |         )}
29 | 
30 |         {schoolGPA && (
31 |           <div className="border-t pt-6">
32 |             <div className="text-center">
33 |               <div className="text-3xl font-bold text-green-600 mb-2">
34 |                 {schoolGPA.averageGPA.toFixed(2)}
35 |               </div>
36 |               <div className="text-gray-600">School Average GPA</div>
37 |               <div className="text-sm text-gray-500 mt-1">
38 |                 Across {schoolGPA.totalStudents} students
39 |               </div>
40 |             </div>
41 |           </div>
42 |         )}
43 | 
44 |         {!isAdmin && userGPA && schoolGPA && userGPA.gpa > 0 && (
45 |           <div className="bg-gray-50 rounded-lg p-4">
46 |             <div className="text-center">
47 |               <div className="text-sm text-gray-600 mb-2">Performance Comparison</div>
48 |               <div className={`text-lg font-semibold ${
49 |                 userGPA.gpa >= schoolGPA.averageGPA ? "text-green-600" : "text-orange-600"
50 |               }`}>
51 |                 {userGPA.gpa >= schoolGPA.averageGPA ? "Above" : "Below"} Average
52 |               </div>
53 |               <div className="text-sm text-gray-500">
54 |                 {userGPA.gpa >= schoolGPA.averageGPA ? "+" : ""}{(userGPA.gpa - schoolGPA.averageGPA).toFixed(2)} points
55 |               </div>
56 |             </div>
57 |           </div>
58 |         )}
59 | 
60 |         {userGPA === undefined || schoolGPA === undefined ? (
61 |           <div className="flex justify-center py-8">
62 |             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
63 |           </div>
64 |         ) : null}
65 |       </div>
66 |     </div>
67 |   );
68 | }
69 | 


--------------------------------------------------------------------------------
/src/components/GradeEntry.tsx:
--------------------------------------------------------------------------------
  1 | import { useState } from "react";
  2 | import { useQuery, useMutation } from "convex/react";
  3 | import { api } from "../../convex/_generated/api";
  4 | import { toast } from "sonner";
  5 | 
  6 | export function GradeEntry() {
  7 |   const [selectedSyllabus, setSelectedSyllabus] = useState<string>("");
  8 |   const [grades, setGrades] = useState<Record<string, { points: string; maxPoints: string }>>({});
  9 | 
 10 |   const syllabi = useQuery(api.syllabi.getUserSyllabi);
 11 |   const assignments = useQuery(
 12 |     api.syllabi.getSyllabusAssignments,
 13 |     selectedSyllabus ? { syllabusId: selectedSyllabus as any } : "skip"
 14 |   )
 15 |   const userGrades = useQuery(api.grades.getUserGrades);
 16 |   const addGrade = useMutation(api.grades.addGrade);
 17 | 
 18 |   const handleGradeChange = (assignmentId: string, field: "points" | "maxPoints", value: string) => {
 19 |     setGrades(prev => ({
 20 |       ...prev,
 21 |       [assignmentId]: {
 22 |         ...prev[assignmentId],
 23 |         [field]: value
 24 |       }
 25 |     }));
 26 |   };
 27 | 
 28 |   const handleSubmitGrade = async (assignmentId: string) => {
 29 |     const gradeData = grades[assignmentId];
 30 |     if (!gradeData?.points || !gradeData?.maxPoints) {
 31 |       toast.error("Please enter both points earned and max points");
 32 |       return;
 33 |     }
 34 | 
 35 |     const pointsEarned = parseFloat(gradeData.points);
 36 |     const maxPoints = parseFloat(gradeData.maxPoints);
 37 | 
 38 |     if (isNaN(pointsEarned) || isNaN(maxPoints) || maxPoints <= 0) {
 39 |       toast.error("Please enter valid numbers");
 40 |       return;
 41 |     }
 42 | 
 43 |     if (pointsEarned > maxPoints) {
 44 |       toast.error("Points earned cannot exceed max points");
 45 |       return;
 46 |     }
 47 | 
 48 |     try {
 49 |       await addGrade({
 50 |         assignmentId: assignmentId as any,
 51 |         pointsEarned,
 52 |         maxPoints,
 53 |       });
 54 |       toast.success("Grade saved successfully!");
 55 |       
 56 |       // Clear the form for this assignment
 57 |       setGrades(prev => ({
 58 |         ...prev,
 59 |         [assignmentId]: { points: "", maxPoints: "" }
 60 |       }));
 61 |     } catch (error) {
 62 |       toast.error("Failed to save grade. Please try again.");
 63 |       console.error(error);
 64 |     }
 65 |   };
 66 | 
 67 |   const getExistingGrade = (assignmentId: string) => {
 68 |     return userGrades?.find(grade => grade.assignmentId === assignmentId);
 69 |   };
 70 | 
 71 |   return (
 72 |     <div className="space-y-8">
 73 |       {/* Course Selection */}
 74 |       <div className="bg-white rounded-lg shadow-md p-6">
 75 |         <h2 className="text-2xl font-semibold text-gray-900 mb-4">Grade Entry!!!</h2>
 76 |         
 77 |         <div className="mb-6">
 78 |           <label htmlFor="syllabus" className="block text-sm font-medium text-gray-700 mb-2">
 79 |             Select Course
 80 |           </label>
 81 |           <select
 82 |             id="syllabus"
 83 |             value={selectedSyllabus}
 84 |             onChange={(e) => setSelectedSyllabus(e.target.value)}
 85 |             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
 86 |           >
 87 |             <option value="">Choose a course...</option>
 88 |             {syllabi?.map((syllabus) => (
 89 |               <option key={syllabus._id} value={syllabus._id}>
 90 |                 {syllabus.courseName} ({syllabus.courseCode}) - {syllabus.semester} {syllabus.year}
 91 |               </option>
 92 |             ))}
 93 |           </select>
 94 |         </div>
 95 | 
 96 |         {/* Assignments */}
 97 |         {assignments && assignments.length > 0 && (
 98 |           <div className="space-y-4">
 99 |             <h3 className="text-lg font-medium text-gray-900">Assignments</h3>
100 |             {assignments.sort((a, b) => {
101 |     const dateA = new Date(a.dueDate || 0).getTime();
102 |     const dateB = new Date(b.dueDate || 0).getTime();
103 |     return dateA - dateB; // Ascending: soonest due first
104 |   }).map((assignment) => {
105 |               const existingGrade = getExistingGrade(assignment._id);
106 |               const currentGrade = grades[assignment._id] || { points: "", maxPoints: "" };
107 |               
108 |               return (
109 |                 <div key={assignment._id} className="border border-gray-200 rounded-lg p-4">
110 |                   <div className="flex justify-between items-start mb-3">
111 |                     <div>
112 |                       <h4 className="font-medium text-gray-900">{assignment.name}</h4>
113 |                       <p className="text-sm text-gray-600">
114 |                         Weight: {assignment.weight}%
115 |                         {assignment.dueDate && ` • Due: ${assignment.dueDate}`}
116 |                         {assignment.category && ` • Category: ${assignment.category}`}
117 |                       </p>
118 |                     </div>
119 |                     {existingGrade && (
120 |                       <div className="text-right">
121 |                         <div className="text-lg font-semibold text-green-600">
122 |                           {existingGrade.percentage.toFixed(1)}%
123 |                         </div>
124 |                         <div className="text-sm text-gray-500">
125 |                           {existingGrade.pointsEarned}/{existingGrade.maxPoints}
126 |                         </div>
127 |                       </div>
128 |                     )}
129 |                   </div>
130 | 
131 |                   <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
132 |                     <div>
133 |                       <label className="block text-sm font-medium text-gray-700 mb-1">
134 |                         Points Earned
135 |                       </label>
136 |                       <input
137 |                         type="number"
138 |                         step="0.01"
139 |                         min="0"
140 |                         value={currentGrade.points}
141 |                         onChange={(e) => handleGradeChange(assignment._id, "points", e.target.value)}
142 |                         className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
143 |                         placeholder="0"
144 |                       />
145 |                     </div>
146 | 
147 |                     <div>
148 |                       <label className="block text-sm font-medium text-gray-700 mb-1">
149 |                         Max Points
150 |                       </label>
151 |                       <input
152 |                         type="number"
153 |                         step="0.01"
154 |                         min="0.01"
155 |                         value={currentGrade.maxPoints}
156 |                         onChange={(e) => handleGradeChange(assignment._id, "maxPoints", e.target.value)}
157 |                         className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
158 |                         placeholder={assignment.maxPoints?.toString() || "100"}
159 |                       />
160 |                     </div>
161 | 
162 |                     <button
163 |                       onClick={() => handleSubmitGrade(assignment._id)}
164 |                       disabled={!currentGrade.points || !currentGrade.maxPoints}
165 |                       className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
166 |                     >
167 |                       {existingGrade ? "Update" : "Save"} Grade
168 |                     </button>
169 |                   </div>
170 |                 </div>
171 |               );
172 |             })}
173 |           </div>
174 |         )}
175 | 
176 |         {selectedSyllabus && assignments && assignments.length === 0 && (
177 |           <div className="text-center py-8">
178 |             <p className="text-gray-500">
179 |               No assignments found for this course. Make sure the syllabus has been processed.
180 |             </p>
181 |           </div>
182 |         )}
183 |       </div>
184 | 
185 |       {/* Recent Grades */}
186 |       <div className="bg-white rounded-lg shadow-md p-6">
187 |         <h3 className="text-xl font-semibold text-gray-900 mb-4">Recent Grades</h3>
188 |         
189 |         {userGrades === undefined ? (
190 |           <div className="flex justify-center py-8">
191 |             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
192 |           </div>
193 |         ) : userGrades.length === 0 ? (
194 |           <p className="text-gray-500 text-center py-8">No grades entered yet.</p>
195 |         ) : (
196 |           <div className="space-y-3">
197 |             {userGrades
198 |               .sort((a, b) => b.enteredAt - a.enteredAt)
199 |               .slice(0, 10)
200 |               .map((grade) => (
201 |                 <div key={grade._id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
202 |                   <div>
203 |                     <div className="font-medium text-gray-900">
204 |                       {grade.assignment?.name}
205 |                     </div>
206 |                     <div className="text-sm text-gray-600">
207 |                       {grade.syllabus?.courseName} ({grade.syllabus?.courseCode})
208 |                     </div>
209 |                   </div>
210 |                   <div className="text-right">
211 |                     <div className="text-lg font-semibold text-blue-600">
212 |                       {grade.percentage.toFixed(1)}%
213 |                     </div>
214 |                     <div className="text-sm text-gray-500">
215 |                       {grade.pointsEarned}/{grade.maxPoints}
216 |                     </div>
217 |                   </div>
218 |                 </div>
219 |               ))}
220 |           </div>
221 |         )}
222 |       </div>
223 |     </div>
224 |   );
225 | }
226 | 


--------------------------------------------------------------------------------
/src/components/ProfileSetup.tsx:
--------------------------------------------------------------------------------
  1 | import { useState } from "react";
  2 | import { useMutation } from "convex/react";
  3 | import { api } from "../../convex/_generated/api";
  4 | import { toast } from "sonner";
  5 | 
  6 | export function ProfileSetup() {
  7 |   const [role, setRole] = useState<"admin" | "undergraduate">("undergraduate");
  8 |   const [firstName, setFirstName] = useState("");
  9 |   const [lastName, setLastName] = useState("");
 10 |   const [studentId, setStudentId] = useState("");
 11 |   const [school, setSchool] = useState("");
 12 |   const [isSubmitting, setIsSubmitting] = useState(false);
 13 | 
 14 |   const createProfile = useMutation(api.users.createUserProfile);
 15 | 
 16 |   const schools = [
 17 |     "George Mason University",
 18 |     "Towson University", 
 19 |     "American University",
 20 |     "Virginia Commonwealth University"
 21 |   ];
 22 | 
 23 |   const handleSubmit = async (e: React.FormEvent) => {
 24 |     e.preventDefault();
 25 |     if (!firstName.trim() || !lastName.trim() || !school.trim()) {
 26 |       toast.error("Please fill in all required fields");
 27 |       return;
 28 |     }
 29 | 
 30 |     if (role === "undergraduate" && !studentId.trim()) {
 31 |       toast.error("Student ID is required for undergraduate accounts");
 32 |       return;
 33 |     }
 34 | 
 35 |     setIsSubmitting(true);
 36 |     try {
 37 |       await createProfile({
 38 |         role,
 39 |         firstName: firstName.trim(),
 40 |         lastName: lastName.trim(),
 41 |         studentId: role === "undergraduate" ? studentId.trim() : undefined,
 42 |         school: school.trim(),
 43 |       });
 44 |       toast.success("Profile created successfully!");
 45 |     } catch (error) {
 46 |       toast.error("Failed to create profile. Please try again.");
 47 |       console.error(error);
 48 |     } finally {
 49 |       setIsSubmitting(false);
 50 |     }
 51 |   };
 52 | 
 53 |   return (
 54 |     <div className="max-w-md mx-auto mt-16 px-4">
 55 |       <div className="bg-white rounded-lg shadow-md p-6">
 56 |         <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Complete Your Profile</h2>
 57 |         
 58 |         <form onSubmit={handleSubmit} className="space-y-4">
 59 |           <div>
 60 |             <label className="block text-sm font-medium text-gray-700 mb-2">
 61 |               Account Type
 62 |             </label>
 63 |             <div className="space-y-2">
 64 |               <label className="flex items-center">
 65 |                 <input
 66 |                   type="radio"
 67 |                   value="undergraduate"
 68 |                   checked={role === "undergraduate"}
 69 |                   onChange={(e) => setRole(e.target.value as "undergraduate")}
 70 |                   className="mr-2"
 71 |                 />
 72 |                 <span>Undergraduate Student</span>
 73 |               </label>
 74 |               <label className="flex items-center">
 75 |                 <input
 76 |                   type="radio"
 77 |                   value="admin"
 78 |                   checked={role === "admin"}
 79 |                   onChange={(e) => setRole(e.target.value as "admin")}
 80 |                   className="mr-2"
 81 |                 />
 82 |                 <span>Administrator</span>
 83 |               </label>
 84 |             </div>
 85 |           </div>
 86 | 
 87 |           <div>
 88 |             <label htmlFor="school" className="block text-sm font-medium text-gray-700 mb-1">
 89 |               School *
 90 |             </label>
 91 |             <select
 92 |               id="school"
 93 |               value={school}
 94 |               onChange={(e) => setSchool(e.target.value)}
 95 |               className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
 96 |               required
 97 |             >
 98 |               <option value="">Select your school</option>
 99 |               {schools.map((schoolOption) => (
100 |                 <option key={schoolOption} value={schoolOption}>
101 |                   {schoolOption}
102 |                 </option>
103 |               ))}
104 |             </select>
105 |           </div>
106 | 
107 |           <div>
108 |             <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
109 |               First Name *
110 |             </label>
111 |             <input
112 |               type="text"
113 |               id="firstName"
114 |               value={firstName}
115 |               onChange={(e) => setFirstName(e.target.value)}
116 |               className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
117 |               required
118 |             />
119 |           </div>
120 | 
121 |           <div>
122 |             <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
123 |               Last Name *
124 |             </label>
125 |             <input
126 |               type="text"
127 |               id="lastName"
128 |               value={lastName}
129 |               onChange={(e) => setLastName(e.target.value)}
130 |               className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
131 |               required
132 |             />
133 |           </div>
134 | 
135 |           {role === "undergraduate" && (
136 |             <div>
137 |               <label htmlFor="studentId" className="block text-sm font-medium text-gray-700 mb-1">
138 |                 Student ID *
139 |               </label>
140 |               <input
141 |                 type="text"
142 |                 id="studentId"
143 |                 value={studentId}
144 |                 onChange={(e) => setStudentId(e.target.value)}
145 |                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
146 |                 required
147 |               />
148 |             </div>
149 |           )}
150 | 
151 |           <button
152 |             type="submit"
153 |             disabled={isSubmitting}
154 |             className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
155 |           >
156 |             {isSubmitting ? "Creating Profile..." : "Create Profile"}
157 |           </button>
158 |         </form>
159 | 
160 |         {role === "admin" && (
161 |           <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
162 |             <p className="text-sm text-blue-700">
163 |               <strong>Note:</strong> Administrator accounts require approval before access is granted.
164 |             </p>
165 |           </div>
166 |         )}
167 |       </div>
168 |     </div>
169 |   );
170 | }
171 | 


--------------------------------------------------------------------------------
/src/components/SyllabusPreview.tsx:
--------------------------------------------------------------------------------
  1 | import { useState, useEffect } from 'react';
  2 | import { toast } from 'sonner';
  3 | 
  4 | interface SyllabusPreviewProps {
  5 |   fileUrl: string;
  6 |   fileName: string;
  7 | }
  8 | 
  9 | export function SyllabusPreview({ fileUrl, fileName }: SyllabusPreviewProps) {
 10 |   const [loading, setLoading] = useState<boolean>(true);
 11 |   const [error, setError] = useState<string | null>(null);
 12 |   
 13 |   // Determine file type for proper rendering
 14 |   const isPdf = fileName.toLowerCase().endsWith('.pdf');
 15 |   const isTxt = fileName.toLowerCase().endsWith('.txt');
 16 | 
 17 |   // For iframe loading and error handling
 18 |   const handleIframeLoad = () => {
 19 |     console.log("PDF iframe loaded successfully");
 20 |     setLoading(false);
 21 |   };
 22 | 
 23 |   const handleIframeError = () => {
 24 |     console.error("Failed to load PDF in iframe");
 25 |     setError("Failed to load PDF preview");
 26 |     setLoading(false);
 27 |     toast.error("Could not load PDF preview. Try downloading the file instead.");
 28 |   };
 29 |   
 30 |   // No proxy URL needed for object tag embedding
 31 | 
 32 |   // Add timeout for loading
 33 |   useEffect(() => {
 34 |     if (isPdf) {
 35 |       // Set a timeout to check if loading takes too long
 36 |       const timeout = setTimeout(() => {
 37 |         if (loading) {
 38 |           console.warn("PDF loading timeout - forcing loading state to false");
 39 |           setLoading(false);
 40 |           toast.error("PDF preview took too long to load. You can still download the file.");
 41 |         }
 42 |       }, 8000); // 8 second timeout
 43 |       
 44 |       return () => clearTimeout(timeout);
 45 |     }
 46 |   }, [loading, isPdf]);
 47 |   
 48 |   // Reset loading state when URL changes
 49 |   useEffect(() => {
 50 |     setLoading(true);
 51 |     setError(null);
 52 |   }, [fileUrl]);
 53 | 
 54 |   if (loading && isPdf) {
 55 |     return (
 56 |       <div className="flex justify-center items-center h-96 bg-gray-50 border rounded-md">
 57 |         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
 58 |         <p className="ml-2 text-gray-500">Loading preview...</p>
 59 |       </div>
 60 |     );
 61 |   }
 62 | 
 63 |   if (error) {
 64 |     return (
 65 |       <div className="flex flex-col justify-center items-center h-96 bg-gray-50 border rounded-md p-4">
 66 |         <div className="text-red-500 mb-4">
 67 |           <p className="font-semibold">Error loading preview</p>
 68 |           <p className="text-sm">{error}</p>
 69 |         </div>
 70 |         <a 
 71 |           href={fileUrl} 
 72 |           target="_blank" 
 73 |           rel="noopener noreferrer"
 74 |           className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
 75 |         >
 76 |           Download {fileName}
 77 |         </a>
 78 |       </div>
 79 |     );
 80 |   }
 81 | 
 82 |   if (!isPdf && !isTxt) {
 83 |     return (
 84 |       <div className="flex flex-col justify-center items-center h-96 bg-gray-50 border rounded-md">
 85 |         <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
 86 |           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
 87 |         </svg>
 88 |         <p className="mt-4 text-gray-600 text-center">
 89 |           Preview not available for this file type.<br />
 90 |           <a 
 91 |             href={fileUrl} 
 92 |             target="_blank" 
 93 |             rel="noopener noreferrer"
 94 |             className="text-blue-600 hover:text-blue-800 hover:underline mt-2 inline-block"
 95 |           >
 96 |             Download to view
 97 |           </a>
 98 |         </p>
 99 |       </div>
100 |     );
101 |   }
102 | 
103 |   return (
104 |     <div className="bg-white border rounded-md shadow-sm overflow-hidden">
105 |       <div className="bg-gray-50 border-b p-3 flex justify-between items-center">
106 |         <h3 className="font-medium text-gray-900 truncate flex-1">{fileName}</h3>
107 |         <a 
108 |           href={fileUrl} 
109 |           target="_blank" 
110 |           rel="noopener noreferrer"
111 |           className="text-blue-600 hover:text-blue-800 hover:underline text-sm flex items-center"
112 |         >
113 |           <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
114 |             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
115 |           </svg>
116 |           Download {isPdf ? 'PDF' : 'File'}
117 |         </a>
118 |       </div>
119 | 
120 |       <div className="overflow-y-auto">
121 |         {isPdf ? (
122 |           <div className="w-full h-[800px] bg-gray-100">
123 |             <object
124 |               data={`${fileUrl}#toolbar=0&navpanes=0&view=FitH`}
125 |               type="application/pdf"
126 |               className="w-full h-full border-none"
127 |               title={fileName}
128 |               onLoad={handleIframeLoad}
129 |               onError={handleIframeError}
130 |             >
131 |               <div className="flex flex-col items-center justify-center w-full h-full p-4 bg-gray-50">
132 |                 <p className="text-gray-500 mb-2">Unable to display PDF</p>
133 |                 <a 
134 |                   href={fileUrl} 
135 |                   target="_blank" 
136 |                   rel="noopener noreferrer"
137 |                   className="text-blue-500 hover:underline"
138 |                 >
139 |                   Download PDF
140 |                 </a>
141 |               </div>
142 |             </object>
143 |           </div>
144 |         ) : isTxt ? (
145 |           <TextFilePreview fileUrl={fileUrl} />
146 |         ) : null}
147 |       </div>
148 |     </div>
149 |   );
150 | }
151 | 
152 | // Component to display text file preview
153 | function TextFilePreview({ fileUrl }: { fileUrl: string }) {
154 |   const [content, setContent] = useState<string>('Loading text content...');
155 |   const [error, setError] = useState<string | null>(null);
156 | 
157 |   useEffect(() => {
158 |     const fetchText = async () => {
159 |       try {
160 |         const response = await fetch(fileUrl);
161 |         if (!response.ok) {
162 |           throw new Error(`Failed to fetch text file: ${response.statusText}`);
163 |         }
164 |         const text = await response.text();
165 |         setContent(text);
166 |       } catch (err) {
167 |         console.error("Error fetching text file:", err);
168 |         setError(err instanceof Error ? err.message : "Failed to load text content");
169 |       }
170 |     };
171 | 
172 |     void fetchText();
173 |   }, [fileUrl]);
174 | 
175 |   if (error) {
176 |     return (
177 |       <div className="p-4 text-red-500">
178 |         <p>Error loading text file: {error}</p>
179 |       </div>
180 |     );
181 |   }
182 | 
183 |   return (
184 |     <pre className="p-4 whitespace-pre-wrap font-mono text-sm overflow-x-auto">
185 |       {content}
186 |     </pre>
187 |   );
188 | }
189 | 


--------------------------------------------------------------------------------
/src/components/SyllabusUpload.tsx:
--------------------------------------------------------------------------------
  1 | import { useState, useRef, useEffect } from "react";
  2 | import { useMutation, useQuery, useAction } from "convex/react";
  3 | import { api } from "../../convex/_generated/api";
  4 | import { toast } from "sonner";
  5 | import type { Id } from "../../convex/_generated/dataModel";
  6 | import { SyllabusPreview } from "./SyllabusPreview";
  7 | import { ExtractedDataEditor } from "./ExtractedDataEditor";
  8 | import type { ExtractedCourseInfo, ExtractedAssignment } from "../../convex/ai";
  9 | 
 10 | export function SyllabusUpload() {
 11 |   // State for UI flow control
 12 |   const [currentStep, setCurrentStep] = useState<'upload' | 'extraction' | 'review'>('upload');
 13 |   const [isUploading, setIsUploading] = useState(false);
 14 |   // Track extraction progress for UI feedback
 15 |   const [_isExtracting, setIsExtracting] = useState(false);
 16 |   const fileInputRef = useRef<HTMLInputElement>(null);
 17 |   
 18 |   // State for uploaded file
 19 |   // We store fileId for potential future use (like re-extraction)
 20 |   const [_uploadedFileId, setUploadedFileId] = useState<Id<"_storage"> | null>(null);
 21 |   const [uploadedFileName, setUploadedFileName] = useState<string>("");
 22 |   const [uploadedFileUrl, setUploadedFileUrl] = useState<string>("");
 23 |   
 24 |   // State for extracted data
 25 |   const [tempSyllabusId, setTempSyllabusId] = useState<Id<"syllabi"> | null>(null);
 26 |   const [courseInfo, setCourseInfo] = useState<ExtractedCourseInfo>({
 27 |     name: "",
 28 |     code: "",
 29 |     semester: "",
 30 |     year: new Date().getFullYear(),
 31 |     confidence: {
 32 |       name: 0,
 33 |       code: 0,
 34 |       semester: 0,
 35 |       year: 0
 36 |     }
 37 |   });
 38 |   const [assignments, setAssignments] = useState<ExtractedAssignment[]>([]);
 39 |   
 40 |   // Convex API hooks
 41 |   const generateUploadUrl = useMutation(api.syllabi.generateUploadUrl);
 42 |   const createSyllabus = useMutation(api.syllabi.createSyllabus);
 43 |   const updateSyllabusInfo = useMutation(api.syllabi.updateSyllabusInfo);
 44 |   const processSyllabus = useMutation(api.syllabi.processSyllabus);
 45 |   const syllabi = useQuery(api.syllabi.getUserSyllabi);
 46 |   const extractAssignments = useAction(api.ai.extractAssignments);
 47 | 
 48 |   // Handle file upload and automatic extraction
 49 |   const handleFileUpload = async () => {
 50 |     const file = fileInputRef.current?.files?.[0];
 51 |     if (!file) {
 52 |       toast.error("Please select a file to upload");
 53 |       return;
 54 |     }
 55 |     
 56 |     // Check file type
 57 |     const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
 58 |     if (!['pdf', 'txt'].includes(fileExt)) {
 59 |       toast.error("Only PDF and TXT files are supported for AI extraction");
 60 |       return;
 61 |     }
 62 | 
 63 |     setIsUploading(true);
 64 |     try {
 65 |       // Generate upload URL and upload file
 66 |       const uploadUrl = await generateUploadUrl();
 67 |       const result = await fetch(uploadUrl, {
 68 |         method: "POST",
 69 |         headers: { "Content-Type": file.type },
 70 |         body: file,
 71 |       });
 72 | 
 73 |       if (!result.ok) {
 74 |         throw new Error("Upload failed");
 75 |       }
 76 | 
 77 |       const { storageId } = await result.json();
 78 |       
 79 |       // Create temporary syllabus record with minimal info
 80 |       const syllabusId = await createSyllabus({
 81 |         courseName: "Extracted from syllabus",
 82 |         courseCode: "TBD",
 83 |         semester: "TBD",
 84 |         year: new Date().getFullYear(),
 85 |         fileId: storageId,
 86 |         fileName: file.name,
 87 |       });
 88 |       
 89 |       setUploadedFileId(storageId);
 90 |       setUploadedFileName(file.name);
 91 |       setTempSyllabusId(syllabusId);
 92 |       
 93 |       // Move to extraction step
 94 |       setCurrentStep('extraction');
 95 |       
 96 |       // Start automatic extraction
 97 |       setIsExtracting(true);
 98 |       const extractionResult = await extractAssignments({ 
 99 |         syllabusId,
100 |         autoProcess: false // Don't automatically save yet, we'll let the user review first
101 |       });
102 |       
103 |       // Update state with extracted data
104 |       setCourseInfo(extractionResult.courseInfo);
105 |       
106 |       // Convert null to undefined for compatibility with the backend schema
107 |       const processedAssignments = extractionResult.assignments.map(a => ({
108 |         ...a,
109 |         dueDate: a.dueDate || null,
110 |         category: a.category || null,
111 |         maxPoints: a.maxPoints || null
112 |       }));
113 |       setAssignments(processedAssignments);
114 |       
115 |       // Move to review step
116 |       setCurrentStep('review');
117 |       
118 |       toast.success("Syllabus analyzed successfully! Please review the extracted information.");
119 |       
120 |     } catch (error) {
121 |       toast.error("Failed to process syllabus. Please try again.");
122 |       console.error(error);
123 |       // Reset to upload step
124 |       setCurrentStep('upload');
125 |     } finally {
126 |       setIsUploading(false);
127 |       setIsExtracting(false);
128 |     }
129 |   };
130 |   
131 |   // When file is selected, automatically start upload and extraction
132 |   const handleFileChange = () => {
133 |     const file = fileInputRef.current?.files?.[0];
134 |     if (file) {
135 |       void handleFileUpload();
136 |     }
137 |   };
138 |   
139 |   // Handle save after review
140 |   const handleSaveExtractedData = async () => {
141 |     if (!tempSyllabusId) {
142 |       toast.error("Something went wrong. Please try again.");
143 |       return;
144 |     }
145 |     
146 |     try {
147 |       // Update syllabus info
148 |       await updateSyllabusInfo({
149 |         syllabusId: tempSyllabusId,
150 |         courseName: courseInfo.name || "Untitled Course",
151 |         courseCode: courseInfo.code || "N/A",
152 |         semester: courseInfo.semester || "N/A",
153 |         year: courseInfo.year || new Date().getFullYear()
154 |       });
155 |       
156 |       // Process assignments
157 |       await processSyllabus({
158 |         syllabusId: tempSyllabusId,
159 |         assignments: assignments.map(a => ({
160 |           name: a.name,
161 |           dueDate: a.dueDate || undefined,
162 |           weight: a.weight,
163 |           category: a.category || undefined,
164 |           maxPoints: a.maxPoints || undefined
165 |         }))
166 |       });
167 |       
168 |       toast.success("Course information and assignments saved successfully!");
169 |       
170 |       // Reset everything and go back to upload step
171 |       setCurrentStep('upload');
172 |       setTempSyllabusId(null);
173 |       setCourseInfo({
174 |         name: "",
175 |         code: "",
176 |         semester: "",
177 |         year: new Date().getFullYear(),
178 |         confidence: { name: 0, code: 0, semester: 0, year: 0 }
179 |       });
180 |       setAssignments([]);
181 |       if (fileInputRef.current) {
182 |         fileInputRef.current.value = "";
183 |       }
184 |     } catch (error) {
185 |       toast.error("Failed to save information. Please try again.");
186 |       console.error(error);
187 |     }
188 |   };
189 |   
190 |   // Cancel current process
191 |   const handleCancel = () => {
192 |     setCurrentStep('upload');
193 |     setTempSyllabusId(null);
194 |     setCourseInfo({
195 |       name: "",
196 |       code: "",
197 |       semester: "",
198 |       year: new Date().getFullYear(),
199 |       confidence: { name: 0, code: 0, semester: 0, year: 0 }
200 |     });
201 |     setAssignments([]);
202 |     if (fileInputRef.current) {
203 |       fileInputRef.current.value = "";
204 |     }
205 |   };
206 | 
207 |   // Get file URL for preview
208 |   useEffect(() => {
209 |     const fetchFileUrl = async () => {
210 |       if (tempSyllabusId) {
211 |         const allSyllabi = syllabi || [];
212 |         const currentSyllabus = allSyllabi.find(s => s._id === tempSyllabusId);
213 |         if (currentSyllabus?.fileUrl) {
214 |           setUploadedFileUrl(currentSyllabus.fileUrl);
215 |         }
216 |       }
217 |     };
218 |     
219 |     void fetchFileUrl();
220 |   }, [syllabi, tempSyllabusId]);
221 | 
222 |   // Render different UI based on current step
223 |   return (
224 |     <div className="space-y-8">
225 |       {/* Step 1: Upload File */}
226 |       {currentStep === 'upload' && (
227 |         <div className="bg-white rounded-lg shadow-md p-6">
228 |           <h2 className="text-2xl font-semibold text-gray-900 mb-6">Upload Syllabus</h2>
229 |           <div className="space-y-6">
230 |             <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
231 |               <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
232 |                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
233 |               </svg>
234 |               <h3 className="mt-2 text-sm font-medium text-gray-900">Upload your syllabus</h3>
235 |               <p className="mt-1 text-xs text-gray-500">PDF or TXT up to 10MB</p>
236 |               <div className="mt-4">
237 |                 <input
238 |                   id="file-upload"
239 |                   name="file-upload"
240 |                   type="file"
241 |                   className="sr-only"
242 |                   ref={fileInputRef}
243 |                   onChange={handleFileChange}
244 |                   accept=".pdf,.txt"
245 |                 />
246 |                 <label
247 |                   htmlFor="file-upload"
248 |                   className="cursor-pointer rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
249 |                 >
250 |                   {isUploading ? "Uploading..." : "Select File"}
251 |                 </label>
252 |               </div>
253 |               <p className="mt-2 text-xs text-gray-500">
254 |                 We'll automatically extract course details and assignments from your syllabus.
255 |               </p>
256 |             </div>
257 |           </div>
258 |         </div>
259 |       )}
260 |       
261 |       {/* Step 2: Extraction in Progress */}
262 |       {currentStep === 'extraction' && (
263 |         <div className="bg-white rounded-lg shadow-md p-6">
264 |           <h2 className="text-2xl font-semibold text-gray-900 mb-6">Analyzing Syllabus</h2>
265 |           <div className="flex flex-col items-center justify-center py-8">
266 |             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
267 |             <p className="mt-4 text-gray-700">Extracting course information and assignments...</p>
268 |             <p className="mt-2 text-sm text-gray-500">This may take a few moments</p>
269 |           </div>
270 |         </div>
271 |       )}
272 |       
273 |       {/* Step 3: Review and Edit */}
274 |       {currentStep === 'review' && uploadedFileUrl && (
275 |         <div className="space-y-4">
276 |           <h2 className="text-2xl font-semibold text-gray-900">Review Syllabus Information</h2>
277 |           <p className="text-gray-600">Review and edit the extracted information before saving.</p>
278 |           
279 |           {/* Side-by-side layout */}
280 |           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
281 |             {/* Left side: File Preview */}
282 |             <div>
283 |               <h3 className="text-lg font-medium text-gray-900 mb-3">Syllabus Preview</h3>
284 |               <SyllabusPreview fileUrl={uploadedFileUrl} fileName={uploadedFileName} />
285 |             </div>
286 |             
287 |             {/* Right side: Extracted Data Editor */}
288 |             <div>
289 |               <h3 className="text-lg font-medium text-gray-900 mb-3">Extracted Information</h3>
290 |               <ExtractedDataEditor
291 |                 courseInfo={courseInfo}
292 |                 assignments={assignments}
293 |                 onCourseInfoChange={setCourseInfo}
294 |                 onAssignmentsChange={setAssignments}
295 |               />
296 |             </div>
297 |           </div>
298 |           
299 |           {/* Action buttons */}
300 |           <div className="flex justify-end space-x-3 mt-6">
301 |             <button
302 |               onClick={handleCancel}
303 |               className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
304 |             >
305 |               Cancel
306 |             </button>
307 |             <button
308 |               onClick={() => { void handleSaveExtractedData(); }}
309 |               className="px-4 py-2 bg-blue-600 rounded-md text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
310 |             >
311 |               Save Information
312 |             </button>
313 |           </div>
314 |         </div>
315 |       )}
316 |       
317 |       {/* Previously Uploaded Syllabi */}
318 |       <div className="bg-white rounded-lg shadow-md p-6">
319 |         <h3 className="text-xl font-semibold text-gray-900 mb-4">Your Syllabi</h3>
320 |         {syllabi === undefined ? (
321 |           <div className="flex justify-center py-8">
322 |             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
323 |           </div>
324 |         ) : syllabi.length === 0 ? (
325 |           <p className="text-gray-500 text-center py-8">No syllabi uploaded yet.</p>
326 |         ) : (
327 |           <div className="space-y-4">
328 |             {syllabi
329 |               .filter(s => s._id !== tempSyllabusId) // Don't show the currently processing syllabus
330 |               .map((syllabus) => (
331 |                 <div key={syllabus._id} className="border border-gray-200 rounded-lg p-4">
332 |                   <div className="flex justify-between items-start">
333 |                     <div>
334 |                       <h4 className="font-medium text-gray-900">
335 |                         {syllabus.courseName} ({syllabus.courseCode})
336 |                       </h4>
337 |                       <p className="text-sm text-gray-600">
338 |                         {syllabus.semester} {syllabus.year}
339 |                       </p>
340 |                       <p className="text-sm text-gray-500">
341 |                         Uploaded: {new Date(syllabus.uploadedAt).toLocaleDateString()}
342 |                       </p>
343 |                     </div>
344 |                     <div className="flex items-center space-x-2">
345 |                       <span className={`px-2 py-1 text-xs rounded-full ${
346 |                         syllabus.isProcessed 
347 |                           ? "bg-green-100 text-green-800" 
348 |                           : "bg-yellow-100 text-yellow-800"
349 |                       }`}>
350 |                         {syllabus.isProcessed ? "Processed" : "Pending"}
351 |                       </span>
352 |                       {syllabus.fileUrl && (
353 |                         <a
354 |                           href={syllabus.fileUrl}
355 |                           target="_blank"
356 |                           rel="noopener noreferrer"
357 |                           className="text-blue-600 hover:text-blue-800 text-sm"
358 |                         >
359 |                           View File
360 |                         </a>
361 |                       )}
362 |                     </div>
363 |                   </div>
364 |                 </div>
365 |               ))}
366 |           </div>
367 |         )}
368 |       </div>
369 |     </div>
370 |   );
371 | }
372 | 


--------------------------------------------------------------------------------
/src/components/ThemeToggle.tsx:
--------------------------------------------------------------------------------
 1 | import { useTheme } from "../contexts/useTheme";
 2 | 
 3 | export function ThemeToggle() {
 4 |   const { theme, toggleTheme } = useTheme();
 5 |   
 6 |   return (
 7 |     <button
 8 |       onClick={toggleTheme}
 9 |       className="p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
10 |       aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
11 |     >
12 |       {theme === 'dark' ? (
13 |         // Sun icon for dark mode (switch to light)
14 |         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-300" viewBox="0 0 20 20" fill="currentColor">
15 |           <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
16 |         </svg>
17 |       ) : (
18 |         // Moon icon for light mode (switch to dark)
19 |         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" viewBox="0 0 20 20" fill="currentColor">
20 |           <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
21 |         </svg>
22 |       )}
23 |     </button>
24 |   );
25 | }
26 | 


--------------------------------------------------------------------------------
/src/components/UserManagement.tsx:
--------------------------------------------------------------------------------
  1 | import { useQuery, useMutation } from "convex/react";
  2 | import { api } from "../../convex/_generated/api";
  3 | import { toast } from "sonner";
  4 | 
  5 | export function UserManagement() {
  6 |   const users = useQuery(api.users.getAllUsers);
  7 |   const approveUser = useMutation(api.users.approveUser);
  8 | 
  9 |   const handleApproveUser = async (profileId: string) => {
 10 |     try {
 11 |       await approveUser({ profileId: profileId as any });
 12 |       toast.success("User approved successfully!");
 13 |     } catch (error) {
 14 |       toast.error("Failed to approve user. Please try again.");
 15 |       console.error(error);
 16 |     }
 17 |   };
 18 | 
 19 |   if (users === undefined) {
 20 |     return (
 21 |       <div className="flex justify-center py-8">
 22 |         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
 23 |       </div>
 24 |     );
 25 |   }
 26 | 
 27 |   const pendingUsers = users.filter(
 28 |     (user) => user.profile && !user.profile.isApproved
 29 |   );
 30 |   const approvedUsers = users.filter(
 31 |     (user) => user.profile && user.profile.isApproved
 32 |   );
 33 | 
 34 |   return (
 35 |     <div className="space-y-8">
 36 |       {/* Pending Approvals */}
 37 |       {pendingUsers.length > 0 && (
 38 |         <div className="bg-white rounded-lg shadow-md p-6">
 39 |           <h2 className="text-xl font-semibold text-gray-900 mb-4">
 40 |             Pending Approvals ({pendingUsers.length})
 41 |           </h2>
 42 | 
 43 |           <div className="space-y-4">
 44 |             {pendingUsers.map((user) => (
 45 |               <div
 46 |                 key={user._id}
 47 |                 className="border border-yellow-200 bg-yellow-50 rounded-lg p-4"
 48 |               >
 49 |                 <div className="flex justify-between items-start">
 50 |                   <div>
 51 |                     <h3 className="font-medium text-gray-900">
 52 |                       {user.profile.firstName} {user.profile.lastName}
 53 |                     </h3>
 54 |                     <p className="text-sm text-gray-600">{user.email}</p>
 55 |                     <p className="text-sm text-gray-600">
 56 |                       School: {user.profile.school}
 57 |                     </p>
 58 |                     <p className="text-sm text-gray-600">
 59 |                       Role:{" "}
 60 |                       {user.profile.role === "admin"
 61 |                         ? "Administrator"
 62 |                         : "Undergraduate"}
 63 |                       {user.profile.studentId &&
 64 |                         ` • Student ID: ${user.profile.studentId}`}
 65 |                     </p>
 66 |                   </div>
 67 |                   <button
 68 |                     onClick={() => {
 69 |                       handleApproveUser(user.profile._id).catch((error) => {
 70 |                         console.error(error);
 71 |                         toast.error("Failed to approve user. Please try again.");
 72 |                       });
 73 |                     }}
 74 |                     className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
 75 |                   >
 76 |                     Approve
 77 |                   </button>
 78 |                 </div>
 79 |               </div>
 80 |             ))}
 81 |           </div>
 82 |         </div>
 83 |       )}
 84 | 
 85 |       {/* All Users */}
 86 |       <div className="bg-white rounded-lg shadow-md p-6">
 87 |         <h2 className="text-xl font-semibold text-gray-900 mb-4">
 88 |           All Users ({approvedUsers.length})
 89 |         </h2>
 90 | 
 91 |         <div className="overflow-x-auto">
 92 |           <table className="min-w-full divide-y divide-gray-200">
 93 |             <thead className="bg-gray-50">
 94 |               <tr>
 95 |                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
 96 |                   Name
 97 |                 </th>
 98 |                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
 99 |                   Email
100 |                 </th>
101 |                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
102 |                   School
103 |                 </th>
104 |                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
105 |                   Role
106 |                 </th>
107 |                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
108 |                   Student ID
109 |                 </th>
110 |                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
111 |                   Status
112 |                 </th>
113 |               </tr>
114 |             </thead>
115 |             <tbody className="bg-white divide-y divide-gray-200">
116 |               {approvedUsers.map((user) => (
117 |                 <tr key={user._id}>
118 |                   <td className="px-6 py-4 whitespace-nowrap">
119 |                     <div className="text-sm font-medium text-gray-900">
120 |                       {user.profile.firstName} {user.profile.lastName}
121 |                     </div>
122 |                   </td>
123 |                   <td className="px-6 py-4 whitespace-nowrap">
124 |                     <div className="text-sm text-gray-900">{user.email}</div>
125 |                   </td>
126 |                   <td className="px-6 py-4 whitespace-nowrap">
127 |                     <div className="text-sm text-gray-900">
128 |                       {user.profile.school}
129 |                     </div>
130 |                   </td>
131 |                   <td className="px-6 py-4 whitespace-nowrap">
132 |                     <span
133 |                       className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
134 |                         user.profile.role === "admin"
135 |                           ? "bg-purple-100 text-purple-800"
136 |                           : "bg-blue-100 text-blue-800"
137 |                       }`}
138 |                     >
139 |                       {user.profile.role === "admin"
140 |                         ? "Administrator"
141 |                         : "Undergraduate"}
142 |                     </span>
143 |                   </td>
144 |                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
145 |                     {user.profile.studentId || "—"}
146 |                   </td>
147 |                   <td className="px-6 py-4 whitespace-nowrap">
148 |                     <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
149 |                       Approved
150 |                     </span>
151 |                   </td>
152 |                 </tr>
153 |               ))}
154 |             </tbody>
155 |           </table>
156 |         </div>
157 | 
158 |         {approvedUsers.length === 0 && (
159 |           <p className="text-gray-500 text-center py-8">
160 |             No approved users yet.
161 |           </p>
162 |         )}
163 |       </div>
164 |     </div>
165 |   );
166 | }
167 | 


--------------------------------------------------------------------------------
/src/main.tsx:
--------------------------------------------------------------------------------
 1 | import { createRoot } from "react-dom/client";
 2 | import { ConvexAuthProvider } from "@convex-dev/auth/react";
 3 | import { ConvexReactClient } from "convex/react";
 4 | import "./index.css";
 5 | import App from "./App";
 6 | 
 7 | const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);
 8 | 
 9 | createRoot(document.getElementById("root")!).render(
10 |   <ConvexAuthProvider client={convex}>
11 |     <App />
12 |   </ConvexAuthProvider>,
13 | );
14 | 


--------------------------------------------------------------------------------