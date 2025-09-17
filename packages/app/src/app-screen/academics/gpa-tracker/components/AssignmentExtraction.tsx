import { Button } from '@/ui/components/Button';
import { TextStyled } from '@/ui/components/Text';
import { TextInput } from '@/ui/components/TextInput';
import Feather from '@expo/vector-icons/Feather';
import { api } from '@unity-house/api/convex/_generated/api';
import { Id } from '@unity-house/api/convex/_generated/dataModel';
import { useAction, useMutation } from 'convex/react';
import React, { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

interface ExtractedCourseInfo {
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

interface ExtractedAssignment {
  name: string;
  dueDate?: string;
  weight: number;
  category?: string;
  maxPoints?: number;
}

interface AssignmentExtractionProps {
  syllabusId: Id<'syllabi'>;
  onComplete: () => void;
}

export function AssignmentExtraction({ syllabusId, onComplete }: AssignmentExtractionProps) {
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionComplete, setExtractionComplete] = useState(false);
  const [courseInfo, setCourseInfo] = useState<ExtractedCourseInfo | null>(null);
  const [assignments, setAssignments] = useState<ExtractedAssignment[]>([]);
  const [editingAssignmentIndex, setEditingAssignmentIndex] = useState<number | null>(null);

  const extractAssignments = useAction(api.gpa.ai.extractAssignments);
  const processSyllabus = useMutation(api.gpa.syllabi.processSyllabus);
  const updateSyllabusInfo = useMutation(api.gpa.syllabi.updateSyllabusInfo);

  const handleExtract = async () => {
    setIsExtracting(true);
    try {
      const result = await extractAssignments({ syllabusId });
      setCourseInfo(result.courseInfo);
      // Convert null values to undefined for compatibility
      const formattedAssignments = result.assignments.map(assignment => ({
        ...assignment,
        dueDate: assignment.dueDate || undefined,
        category: assignment.category || undefined,
        maxPoints: assignment.maxPoints || undefined
      }));
      setAssignments(formattedAssignments);
      setExtractionComplete(true);
    } catch (error) {
      console.error('Error extracting assignments:', error);
      alert('Error extracting assignments. Please try again.');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSave = async () => {
    try {
      // Update syllabus info if available
      if (courseInfo) {
        const updateData: any = {};
        if (courseInfo.name) updateData.courseName = courseInfo.name;
        if (courseInfo.code) updateData.courseCode = courseInfo.code;
        if (courseInfo.semester) updateData.semester = courseInfo.semester;
        if (courseInfo.year) updateData.year = courseInfo.year;
        
        if (Object.keys(updateData).length > 0) {
          await updateSyllabusInfo({
            syllabusId,
            ...updateData
          });
        }
      }
      
      // Ensure assignments have the correct types for API
      const processedAssignments = assignments.map(assignment => ({
        name: assignment.name,
        dueDate: assignment.dueDate || undefined,
        weight: assignment.weight,
        category: assignment.category || undefined,
        maxPoints: assignment.maxPoints || undefined
      }));
      
      // Save assignments
      await processSyllabus({
        syllabusId,
        assignments: processedAssignments
      });
      
      alert('Syllabus processed successfully!');
      onComplete();
    } catch (error) {
      console.error('Error saving syllabus data:', error);
      alert('Error saving syllabus data. Please try again.');
    }
  };

  const handleAddAssignment = () => {
    const newAssignment: ExtractedAssignment = {
      name: "New Assignment",
      weight: 0,
      maxPoints: 100
    };
    setAssignments([...assignments, newAssignment]);
    setEditingAssignmentIndex(assignments.length);
  };

  const handleUpdateAssignment = (index: number, field: keyof ExtractedAssignment, value: any) => {
    const updatedAssignments = [...assignments];
    updatedAssignments[index] = { ...updatedAssignments[index], [field]: value };
    setAssignments(updatedAssignments);
  };

  const handleDeleteAssignment = (index: number) => {
    const updatedAssignments = assignments.filter((_, i) => i !== index);
    setAssignments(updatedAssignments);
    setEditingAssignmentIndex(null);
  };

  const handleUpdateCourseInfo = (field: keyof ExtractedCourseInfo, value: any) => {
    if (!courseInfo) return;
    setCourseInfo({
      ...courseInfo,
      [field]: value
    });
  };

  return (
    <View className="space-y-6">
      <TextStyled variant="h3" weight="semibold" className="mb-2">
        Extract Assignments
      </TextStyled>
      
      <View className="bg-white border border-gray-200 p-6 rounded-lg">
        {!extractionComplete ? (
          <View className="items-center py-8">
            <Feather name="file-text" size={48} color="#6B7280" />
            <TextStyled className="mt-4 text-center mb-6">
              Extract assignments and course information from your syllabus using AI.
            </TextStyled>
            <Button
              variant="primary"
              size="lg"
              onPress={handleExtract}
              disabled={isExtracting}
            >
              {isExtracting ? 'Extracting...' : 'Extract Assignments'}
            </Button>
          </View>
        ) : (
          <ScrollView className="space-y-6">
            {/* Course Info Section */}
            <View className="space-y-4">
              <TextStyled variant="h4" weight="semibold">Course Information</TextStyled>
              
              <View>
                <TextInput
                  label={
                    <>
                      Course Name
                      {courseInfo?.confidence.name && courseInfo.confidence.name > 0 && (
                        <TextStyled color="muted" className="text-sm ml-1">
                          (Confidence: {Math.round(courseInfo.confidence.name * 100)}%)
                        </TextStyled>
                      )}
                    </>
                  }
                  value={courseInfo?.name || ''}
                  onChangeText={(text) => handleUpdateCourseInfo('name', text)}
                  placeholder="Course Name"
                />
              </View>
              
              <View>
                <TextInput
                  label={
                    <>
                      Course Code
                      {courseInfo?.confidence.code && courseInfo.confidence.code > 0 && (
                        <TextStyled color="muted" className="text-sm ml-1">
                          (Confidence: {Math.round(courseInfo.confidence.code * 100)}%)
                        </TextStyled>
                      )}
                    </>
                  }
                  value={courseInfo?.code || ''}
                  onChangeText={(text) => handleUpdateCourseInfo('code', text)}
                  placeholder="Course Code"
                />
              </View>
              
              <View className="flex-row space-x-4">
                <View className="flex-1">
                  <TextInput
                    label={
                      <>
                        Semester
                        {courseInfo?.confidence.semester && courseInfo.confidence.semester > 0 && (
                          <TextStyled color="muted" className="text-sm ml-1">
                            (Confidence: {Math.round(courseInfo.confidence.semester * 100)}%)
                          </TextStyled>
                        )}
                      </>
                    }
                    value={courseInfo?.semester || ''}
                    onChangeText={(text) => handleUpdateCourseInfo('semester', text)}
                    placeholder="Semester"
                  />
                </View>
                
                <View className="flex-1">
                  <TextInput
                    label={
                      <>
                        Year
                        {courseInfo?.confidence.year && courseInfo.confidence.year > 0 && (
                          <TextStyled color="muted" className="text-sm ml-1">
                            (Confidence: {Math.round(courseInfo.confidence.year * 100)}%)
                          </TextStyled>
                        )}
                      </>
                    }
                    value={courseInfo?.year?.toString() || ''}
                    onChangeText={(text) => handleUpdateCourseInfo('year', parseInt(text) || undefined)}
                    keyboardType="numeric"
                    placeholder="Year"
                  />
                </View>
              </View>
            </View>
            
            {/* Assignments Section */}
            <View className="space-y-4">
              <View className="flex-row justify-between items-center">
                <TextStyled variant="h4" weight="semibold">Assignments ({assignments.length})</TextStyled>
                <Pressable 
                  onPress={handleAddAssignment}
                  className="flex-row items-center"
                >
                  <Feather name="plus" size={16} color="#4F46E5" />
                  <TextStyled color="primary" className="ml-1">Add Assignment</TextStyled>
                </Pressable>
              </View>
              
              {assignments.length === 0 ? (
                <View className="bg-gray-50 p-4 rounded-lg items-center">
                  <TextStyled color="muted" className="text-center">
                    No assignments detected. Add assignments manually.
                  </TextStyled>
                </View>
              ) : (
                <View className="space-y-4">
                  {assignments.map((assignment, index) => (
                    <Pressable 
                      key={index}
                      onPress={() => setEditingAssignmentIndex(index)}
                      className={`border rounded-lg p-4 ${editingAssignmentIndex === index ? 'border-primary-500 bg-primary-50' : 'border-gray-200'}`}
                    >
                      {editingAssignmentIndex === index ? (
                        <View className="space-y-3">
                          <View>
                            <TextInput
                              label="Assignment Name"
                              value={assignment.name}
                              onChangeText={(text) => handleUpdateAssignment(index, 'name', text)}
                              placeholder="Assignment Name"
                            />
                          </View>
                          
                          <View className="flex-row space-x-4">
                            <View className="flex-1">
                              <TextInput
                                label="Category"
                                value={assignment.category || ''}
                                onChangeText={(text) => handleUpdateAssignment(index, 'category', text)}
                                placeholder="e.g., Exam, Homework"
                              />
                            </View>
                            
                            <View className="flex-1">
                              <TextInput
                                label="Due Date"
                                value={assignment.dueDate || ''}
                                onChangeText={(text) => handleUpdateAssignment(index, 'dueDate', text)}
                                placeholder="YYYY-MM-DD"
                              />
                            </View>
                          </View>
                          
                          <View className="flex-row space-x-4">
                            <View className="flex-1">
                              <TextInput
                                label="Weight (%)"
                                value={assignment.weight.toString()}
                                onChangeText={(text) => handleUpdateAssignment(index, 'weight', parseFloat(text) || 0)}
                                keyboardType="numeric"
                                placeholder="0-100"
                              />
                            </View>
                            
                            <View className="flex-1">
                              <TextInput
                                label="Max Points"
                                value={assignment.maxPoints?.toString() || ''}
                                onChangeText={(text) => handleUpdateAssignment(index, 'maxPoints', parseInt(text) || undefined)}
                                keyboardType="numeric"
                                placeholder="e.g., 100"
                              />
                            </View>
                          </View>
                          
                          <View className="flex-row justify-end">
                            <Pressable 
                              onPress={() => handleDeleteAssignment(index)}
                              className="flex-row items-center"
                            >
                              <Feather name="trash-2" size={16} color="#EF4444" />
                              <TextStyled color="error" className="ml-1">Delete</TextStyled>
                            </Pressable>
                          </View>
                        </View>
                      ) : (
                        <View>
                          <View className="flex-row justify-between">
                            <TextStyled weight="semibold">{assignment.name}</TextStyled>
                            <TextStyled weight="semibold">{assignment.weight}%</TextStyled>
                          </View>
                          <View className="flex-row justify-between mt-1">
                            <TextStyled color="muted">
                              {assignment.category || 'No category'} 
                              {assignment.dueDate ? ` • Due: ${assignment.dueDate}` : ''}
                            </TextStyled>
                            <TextStyled color="muted">
                              {assignment.maxPoints ? `${assignment.maxPoints} pts` : ''}
                            </TextStyled>
                          </View>
                        </View>
                      )}
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
            
            {/* Save Button */}
            <Button
              variant="primary"
              size="lg"
              onPress={handleSave}
              className="mt-4"
            >
              Save and Process Syllabus
            </Button>
          </ScrollView>
        )}
      </View>
    </View>
  );
}
