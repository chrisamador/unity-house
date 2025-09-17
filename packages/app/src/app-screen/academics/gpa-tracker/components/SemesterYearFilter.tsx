import { TextStyled } from '@/ui/components/Text';
import Feather from '@expo/vector-icons/Feather';
import { api } from '@unity-house/api/convex/_generated/api';
import { useQuery } from 'convex/react';
import React, { useState } from 'react';
import { Pressable, View } from 'react-native';

interface SemesterYearFilterProps {
  selectedSemester: string;
  selectedYear: number;
  onSemesterChange: (semester: string) => void;
  onYearChange: (year: number) => void;
}

export function SemesterYearFilter({
  selectedSemester,
  selectedYear,
  onSemesterChange,
  onYearChange,
}: SemesterYearFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Get available semesters and years from courses
  const courses = useQuery(api.gpa.grades.getAvailableSemesters) || [];
  
  // Extract unique semesters and years
  const semesters = courses.length > 0
    ? [...new Set(courses.map((course: {semester: string}) => course.semester))].sort()
    : ['Fall', 'Spring', 'Summer'];
    
  const years = courses.length > 0
    ? [...new Set(courses.map((course: {year: number}) => course.year))].sort((a: number, b: number) => b - a) // Sort descending
    : [new Date().getFullYear(), new Date().getFullYear() - 1];

  return (
    <View className="mb-4">
      <Pressable 
        onPress={() => setIsOpen(!isOpen)}
        className="flex-row items-center justify-between bg-gray-100 rounded-lg p-3"
      >
        <TextStyled weight="semibold">
          {selectedSemester} {selectedYear === 0 ? '' : selectedYear}
        </TextStyled>
        <Feather name={isOpen ? "chevron-up" : "chevron-down"} size={20} color="#4B5563" />
      </Pressable>
      
      {isOpen && (
        <View className="bg-white border border-gray-200 rounded-lg mt-1 p-2 shadow-sm">
          <View className="mb-3">
            <TextStyled weight="semibold" className="mb-2">Semester</TextStyled>
            <View className="flex-row flex-wrap gap-2">
              {semesters.map(semester => (
                <Pressable
                  key={semester}
                  onPress={() => onSemesterChange(semester)}
                  className={`px-3 py-1 rounded-full ${
                    selectedSemester === semester ? 'bg-primary-500' : 'bg-gray-100'
                  }`}
                >
                  <TextStyled 
                    color={selectedSemester === semester ? 'white' : 'default'}
                  >
                    {semester}
                  </TextStyled>
                </Pressable>
              ))}
              <Pressable
                onPress={() => onSemesterChange('All')}
                className={`px-3 py-1 rounded-full ${
                  selectedSemester === 'All' ? 'bg-primary-500' : 'bg-gray-100'
                }`}
              >
                <TextStyled 
                  color={selectedSemester === 'All' ? 'white' : 'default'}
                >
                  All
                </TextStyled>
              </Pressable>
            </View>
          </View>
          
          <View>
            <TextStyled weight="semibold" className="mb-2">Year</TextStyled>
            <View className="flex-row flex-wrap gap-2">
              {years.map(year => (
                <Pressable
                  key={year}
                  onPress={() => onYearChange(year)}
                  className={`px-3 py-1 rounded-full ${
                    selectedYear === year ? 'bg-primary-500' : 'bg-gray-100'
                  }`}
                >
                  <TextStyled 
                    color={selectedYear === year ? 'white' : 'default'}
                  >
                    {year}
                  </TextStyled>
                </Pressable>
              ))}
              <Pressable
                onPress={() => onYearChange(0)}
                className={`px-3 py-1 rounded-full ${
                  selectedYear === 0 ? 'bg-primary-500' : 'bg-gray-100'
                }`}
              >
                <TextStyled 
                  color={selectedYear === 0 ? 'white' : 'default'}
                >
                  All
                </TextStyled>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
