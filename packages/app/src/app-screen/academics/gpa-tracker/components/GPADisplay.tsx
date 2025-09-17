import { useAuth } from '@/context/auth';
import { TextStyled } from '@/ui/components/Text';
import Feather from '@expo/vector-icons/Feather';
import { api } from '@unity-house/api/convex/_generated/api';
import { useMutation, useQuery } from 'convex/react';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { SemesterYearFilter } from './SemesterYearFilter';

interface GPAData {
  gpa: number;
  totalCredits: number;
  semester?: string;
  year?: number;
}

interface SchoolGPAData {
  averageGPA: number;
  totalStudents: number;
}

export function GPADisplay() {
  const { state } = useAuth();
  const user = state.useGetState(s => s);
  const [isCalculating, setIsCalculating] = useState(false);
  
  // Filter state
  const [selectedSemester, setSelectedSemester] = useState<string>('All');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  
  // Determine if user is admin
  const isAdmin = user.status === 'loaded' && user.user.memberType === 'admin';
  
  // Fetch real GPA data from Convex
  const calculateSemesterGPA = useMutation(api.gpa.grades.calculateSemesterGPA);
  const schoolGPAData = useQuery(api.gpa.grades.getSchoolAverageGPA, {
    semester: selectedSemester !== 'All' ? selectedSemester : undefined,
    year: selectedYear !== 0 ? selectedYear : undefined
  });
  
  // Store calculated GPA
  const [userGPA, setUserGPA] = useState<GPAData>({ gpa: 0, totalCredits: 0, semester: 'All', year: 0 });
  
  // Determine loading state
  const isLoading = isCalculating || schoolGPAData === undefined;
  
  // Calculate GPA when filters change
  useEffect(() => {
    const fetchGPA = async () => {
      if (user.status === 'loaded') {
        setIsCalculating(true);
        try {
          const result = await calculateSemesterGPA({
            semester: selectedSemester !== 'All' ? selectedSemester : undefined,
            year: selectedYear !== 0 ? selectedYear : undefined
          });
          setUserGPA(result);
        } catch (error) {
          console.error('Error calculating GPA:', error);
        } finally {
          setIsCalculating(false);
        }
      }
    };
    
    fetchGPA();
  }, [user.status, calculateSemesterGPA, selectedSemester, selectedYear]);
  
  // Extract school GPA data
  const schoolGPA = schoolGPAData || { averageGPA: 0, totalStudents: 0 };

  return (
    <View className="space-y-6">
      <TextStyled variant="h3" weight="semibold" className="mb-2">
        {isAdmin ? "School Statistics" : "Your Academic Performance"}
      </TextStyled>
      
      {/* Semester/Year Filter */}
      {!isAdmin && (
        <SemesterYearFilter
          selectedSemester={selectedSemester}
          selectedYear={selectedYear}
          onSemesterChange={setSelectedSemester}
          onYearChange={setSelectedYear}
        />
      )}
      
      <View className="bg-white border border-gray-200 p-6 rounded-lg">
        {isLoading ? (
          <View className="items-center py-8">
            <Feather name="loader" size={24} color="#6B7280" />
            <TextStyled className="mt-2 text-center">Loading GPA data...</TextStyled>
          </View>
        ) : (
          <View className="space-y-6">
            {/* User GPA */}
            {!isAdmin && (
              <View className="items-center">
                <View className="w-32 h-32 rounded-full bg-primary-500 items-center justify-center mb-4">
                  <TextStyled variant="h1" weight="bold" color="white">
                    {userGPA.gpa.toFixed(2)}
                  </TextStyled>
                </View>
                <TextStyled variant="h4" weight="semibold">Your Current GPA</TextStyled>
                <TextStyled color="muted">Based on {userGPA.totalCredits} credit hours</TextStyled>
              </View>
            )}
            
            {/* School Average */}
            <View className={!isAdmin ? "border-t border-gray-200 pt-6" : ""}>
              <View className="items-center">
                <View className="w-24 h-24 rounded-full bg-green-500 items-center justify-center mb-4">
                  <TextStyled variant="h2" weight="bold" color="white">
                    {schoolGPA.averageGPA.toFixed(2)}
                  </TextStyled>
                </View>
                <TextStyled variant="h4" weight="semibold">School Average GPA</TextStyled>
                <TextStyled color="muted">Across {schoolGPA.totalStudents} students</TextStyled>
              </View>
            </View>
            
            {/* Comparison */}
            {!isAdmin && userGPA.gpa > 0 && schoolGPA.averageGPA > 0 && (
              <View className="bg-gray-50 rounded-lg p-4">
                <TextStyled className="text-center mb-2">Performance Comparison</TextStyled>
                <View className="items-center">
                  <TextStyled 
                    variant="h4" 
                    weight="semibold" 
                    color={userGPA.gpa >= schoolGPA.averageGPA ? "success" : "warning"}
                  >
                    {userGPA.gpa >= schoolGPA.averageGPA ? "Above" : "Below"} Average
                  </TextStyled>
                  <TextStyled>
                    {userGPA.gpa >= schoolGPA.averageGPA ? "+" : ""}
                    {Math.abs(userGPA.gpa - schoolGPA.averageGPA).toFixed(2)} points
                  </TextStyled>
                </View>
              </View>
            )}
            
            {/* No Data Message */}
            {!isAdmin && userGPA.gpa === 0 && (
              <View className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <TextStyled className="text-center">
                  No GPA data available yet. Enter grades for your courses to see your GPA.
                </TextStyled>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
}
