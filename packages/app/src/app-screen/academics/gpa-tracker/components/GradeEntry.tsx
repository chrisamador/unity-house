import { Button } from '@/ui/components/Button';
import { TextStyled } from '@/ui/components/Text';
import { TextInput } from '@/ui/components/TextInput';
import { api } from '@unity-house/api/convex/_generated/api';
import { Id } from '@unity-house/api/convex/_generated/dataModel';
import { useMutation, useQuery } from 'convex/react';
import React, { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

export function GradeEntry() {
  const [selectedCourse, setSelectedCourse] = useState<Id<'courses'> | null>(null);
  const [grades, setGrades] = useState<Record<string, { points: string; maxPoints: string }>>({});

  const userCourses = useQuery(api.gpa.courses.getUserCourses) || [];
  const assignments = useQuery(
    api.gpa.courses.getSyllabusAssignments,
    selectedCourse ? { courseId: selectedCourse } : 'skip'
  ) || [];
  const userGrades = useQuery(api.gpa.grades.getUserGrades) || [];
  const addGrade = useMutation(api.gpa.grades.addGrade);

  const handleGradeChange = (assignmentId: Id<'assignments'>, field: 'points' | 'maxPoints', value: string) => {
    setGrades(prev => ({
      ...prev,
      [assignmentId]: {
        ...prev[assignmentId],
        [field]: value
      }
    }));
  };

  const handleSubmitGrade = async (assignmentId: Id<'assignments'>) => {
    const gradeData = grades[assignmentId];
    if (!gradeData?.points || !gradeData?.maxPoints) {
      alert('Please enter both points earned and max points');
      return;
    }

    const pointsEarned = parseFloat(gradeData.points);
    const maxPoints = parseFloat(gradeData.maxPoints);

    if (isNaN(pointsEarned) || isNaN(maxPoints) || maxPoints <= 0) {
      alert('Please enter valid numbers');
      return;
    }

    if (pointsEarned > maxPoints) {
      alert('Points earned cannot exceed max points');
      return;
    }

    try {
      await addGrade({
        assignmentId,
        pointsEarned,
        maxPoints,
      });

      // Clear the form for this assignment
      setGrades(prev => ({
        ...prev,
        [assignmentId]: { points: '', maxPoints: '' }
      }));

      alert('Grade saved successfully!');
    } catch (error) {
      console.error('Error saving grade:', error);
      alert('Error saving grade. Please try again.');
    }
  };

  const getExistingGrade = (assignmentId: Id<'assignments'>) => {
    return userGrades.find(grade => grade.assignmentId === assignmentId);
  };

  return (
    <View className="space-y-6">
      <TextStyled variant="h3" weight="semibold" className="mb-2">
        Grade Entry
      </TextStyled>
      
      {/* Course Selection */}
      <View className="bg-white border border-gray-200 p-6 rounded-lg">
        <TextStyled className="mb-4">
          Select a course to enter or update your grades for assignments.
        </TextStyled>
        
        <View className="mb-6">
          <TextStyled weight="semibold" className="mb-2">Select Course</TextStyled>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row space-x-3">
            {userCourses.length === 0 ? (
              <View className="bg-gray-50 p-4 rounded-lg">
                <TextStyled color="muted">No courses available</TextStyled>
              </View>
            ) : (
              userCourses.map((course) => (
                <Pressable
                  key={course._id}
                  onPress={() => setSelectedCourse(course._id)}
                  className={`border rounded-lg p-4 min-w-[200px] ${
                    selectedCourse === course._id ? 'border-primary-500 bg-primary-50' : 'border-gray-200'
                  }`}
                >
                  <TextStyled weight="semibold">{course.courseName}</TextStyled>
                  <TextStyled color="muted">{course.courseCode}</TextStyled>
                  <TextStyled color="muted">{course.semester} {course.year}</TextStyled>
                </Pressable>
              ))
            )}
          </ScrollView>
        </View>
        
        {/* Assignments */}
        {selectedCourse && (
          <View className="space-y-4">
            <TextStyled variant="h4" weight="semibold">Assignments</TextStyled>
            
            {assignments.length === 0 ? (
              <View className="bg-gray-50 p-4 rounded-lg items-center">
                <TextStyled color="muted" className="text-center">
                  No assignments found for this course. Make sure the syllabus has been processed.
                </TextStyled>
              </View>
            ) : (
              assignments.sort((a, b) => {
                const dateA = new Date(a.dueDate || '9999-12-31').getTime();
                const dateB = new Date(b.dueDate || '9999-12-31').getTime();
                return dateA - dateB;
              }).map((assignment) => {
                const existingGrade = getExistingGrade(assignment._id);
                const currentGrade = grades[assignment._id] || { points: '', maxPoints: '' };
                
                return (
                  <View key={assignment._id} className="border border-gray-200 rounded-lg p-4">
                    <View className="flex-row justify-between items-start mb-3">
                      <View>
                        <TextStyled weight="semibold">{assignment.name}</TextStyled>
                        <TextStyled color="muted">
                          Weight: {assignment.weight}%
                          {assignment.dueDate && ` • Due: ${assignment.dueDate}`}
                          {assignment.category && ` • ${assignment.category}`}
                        </TextStyled>
                      </View>
                      {existingGrade && (
                        <View className="bg-green-100 px-2 py-1 rounded">
                          <TextStyled color="success" weight="semibold">
                            {existingGrade.percentage.toFixed(1)}%
                          </TextStyled>
                        </View>
                      )}
                    </View>
                    
                    <View className="flex-row space-x-4 items-end">
                      <View className="flex-1">
                        <TextInput
                          label="Points Earned"
                          value={currentGrade.points}
                          onChangeText={(text) => handleGradeChange(assignment._id, 'points', text)}
                          keyboardType="numeric"
                          placeholder={existingGrade ? existingGrade.pointsEarned.toString() : '0'}
                        />
                      </View>
                      
                      <View className="flex-1">
                        <TextInput
                          label="Max Points"
                          value={currentGrade.maxPoints}
                          onChangeText={(text) => handleGradeChange(assignment._id, 'maxPoints', text)}
                          keyboardType="numeric"
                          placeholder={
                            existingGrade 
                              ? existingGrade.maxPoints.toString() 
                              : assignment.maxPoints?.toString() || '100'
                          }
                        />
                      </View>
                      
                      <Button
                        variant="primary"
                        size="sm"
                        onPress={() => handleSubmitGrade(assignment._id)}
                        disabled={!currentGrade.points || !currentGrade.maxPoints}
                      >
                        {existingGrade ? 'Update' : 'Save'}
                      </Button>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}
      </View>
      
      {/* Recent Grades */}
      <View className="bg-white border border-gray-200 p-6 rounded-lg">
        <TextStyled variant="h4" weight="semibold" className="mb-4">
          Recent Grades
        </TextStyled>
        
        {userGrades.length === 0 ? (
          <TextStyled className="text-center italic">
            You haven&apos;t entered any grades yet.
          </TextStyled>
        ) : (
          <View className="space-y-3">
            {userGrades
              .sort((a, b) => b.enteredAt - a.enteredAt)
              .slice(0, 5)
              .map((grade) => (
                <View key={grade._id} className="bg-gray-50 rounded-lg p-4">
                  <View className="flex-row justify-between items-center">
                    <View>
                      <TextStyled weight="semibold">{grade.assignment?.name}</TextStyled>
                      <TextStyled color="muted">{grade.course?.courseName} ({grade.course?.courseCode})</TextStyled>
                    </View>
                    <View className="items-end">
                      <TextStyled weight="semibold" color="primary">{grade.percentage.toFixed(1)}%</TextStyled>
                      <TextStyled color="muted">{grade.pointsEarned}/{grade.maxPoints}</TextStyled>
                    </View>
                  </View>
                </View>
              ))
            }
          </View>
        )}
      </View>
    </View>
  );
}
