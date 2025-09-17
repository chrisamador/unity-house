import React, { useState } from 'react';
import { View, Pressable, ScrollView } from 'react-native';
import { TextStyled } from '@/ui/components/Text';
import { Button } from '@/ui/components/Button';
import { useAuth } from '@/context/auth';

export function UserManagement() {
  const [selectedTab, setSelectedTab] = useState<'users' | 'statistics'>('users');
  const { state } = useAuth();
  const user = state.useGetState(s => s);
  
  // Mock data
  const mockUsers = [
    {
      _id: '1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      school: 'George Mason University',
      memberType: 'undergraduate',
      approvedBy: '3'
    },
    {
      _id: '2',
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@example.com',
      school: 'Towson University',
      memberType: 'undergraduate',
      approvedBy: null
    },
    {
      _id: '3',
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@example.com',
      school: 'George Mason University',
      memberType: 'admin',
      approvedBy: null
    }
  ];
  
  const mockSchoolStats = {
    'George Mason University': {
      totalUsers: 45,
      totalCourses: 156,
      averageGPA: 3.42
    },
    'Towson University': {
      totalUsers: 32,
      totalCourses: 98,
      averageGPA: 3.28
    },
    'American University': {
      totalUsers: 28,
      totalCourses: 87,
      averageGPA: 3.51
    }
  };
  
  const isAdmin = user.status === 'loaded' && user.user.memberType === 'admin';
  
  const handleApproveUser = async (userId: string) => {
    // Mock approval action
    alert('User approved successfully!');
  };
  
  if (!isAdmin) {
    return (
      <View className="space-y-6">
        <TextStyled variant="h3" weight="semibold" className="mb-2">
          Admin Access Required
        </TextStyled>
        
        <View className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg">
          <TextStyled className="text-center">
            You need admin privileges to access this section.
          </TextStyled>
        </View>
      </View>
    );
  }
  
  return (
    <View className="space-y-6">
      <TextStyled variant="h3" weight="semibold" className="mb-2">
        Admin Dashboard
      </TextStyled>
      
      {/* Tab Navigation */}
      <View className="flex-row border-b border-gray-200 mb-4">
        <Pressable 
          onPress={() => setSelectedTab('users')}
          className={`py-2 px-4 ${selectedTab === 'users' ? 'border-b-2 border-primary-500' : ''}`}
        >
          <TextStyled 
            weight={selectedTab === 'users' ? 'semibold' : 'normal'} 
            color={selectedTab === 'users' ? 'primary' : 'default'}
          >
            User Management
          </TextStyled>
        </Pressable>
        
        <Pressable 
          onPress={() => setSelectedTab('statistics')}
          className={`py-2 px-4 ${selectedTab === 'statistics' ? 'border-b-2 border-primary-500' : ''}`}
        >
          <TextStyled 
            weight={selectedTab === 'statistics' ? 'semibold' : 'normal'} 
            color={selectedTab === 'statistics' ? 'primary' : 'default'}
          >
            School Statistics
          </TextStyled>
        </Pressable>
      </View>
      
      {/* Users Tab */}
      {selectedTab === 'users' && (
        <View className="bg-white border border-gray-200 p-6 rounded-lg">
          <TextStyled variant="h4" weight="semibold" className="mb-4">
            User Management
          </TextStyled>
          
          {mockUsers.length === 0 ? (
            <TextStyled className="text-center italic">
              No users found.
            </TextStyled>
          ) : (
            <ScrollView className="space-y-4">
              {mockUsers.map((user) => (
                <View key={user._id} className="border border-gray-200 rounded-lg p-4">
                  <View className="flex-row justify-between items-start">
                    <View>
                      <TextStyled weight="semibold">
                        {user.firstName} {user.lastName}
                      </TextStyled>
                      <TextStyled color="muted">{user.email}</TextStyled>
                      <TextStyled color="muted">
                        {user.school || 'No school'} • {user.memberType}
                      </TextStyled>
                    </View>
                    
                    <View>
                      {user.approvedBy ? (
                        <View className="bg-green-100 px-2 py-1 rounded">
                          <TextStyled color="success" className="text-sm">Approved</TextStyled>
                        </View>
                      ) : (
                        <Button
                          variant="primary"
                          size="sm"
                          onPress={() => handleApproveUser(user._id)}
                        >
                          Approve
                        </Button>
                      )}
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      )}
      
      {/* Statistics Tab */}
      {selectedTab === 'statistics' && (
        <View className="bg-white border border-gray-200 p-6 rounded-lg">
          <TextStyled variant="h4" weight="semibold" className="mb-4">
            School Statistics
          </TextStyled>
          
          {Object.keys(mockSchoolStats).length === 0 ? (
            <TextStyled className="text-center italic">
              No statistics available.
            </TextStyled>
          ) : (
            <ScrollView className="space-y-4">
              {Object.entries(mockSchoolStats).map(([school, stats]: [string, any]) => (
                <View key={school} className="border border-gray-200 rounded-lg p-4">
                  <TextStyled variant="h4" weight="semibold" className="mb-2">
                    {school}
                  </TextStyled>
                  
                  <View className="flex-row justify-between mb-2">
                    <TextStyled>Total Students:</TextStyled>
                    <TextStyled weight="semibold">{stats.totalUsers}</TextStyled>
                  </View>
                  
                  <View className="flex-row justify-between mb-2">
                    <TextStyled>Total Courses:</TextStyled>
                    <TextStyled weight="semibold">{stats.totalCourses}</TextStyled>
                  </View>
                  
                  <View className="flex-row justify-between">
                    <TextStyled>Average GPA:</TextStyled>
                    <TextStyled weight="semibold" color="primary">
                      {stats.averageGPA.toFixed(2)}
                    </TextStyled>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      )}
    </View>
  );
}
