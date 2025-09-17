import { TextStyled } from '@/ui/components/Text';
import Feather from '@expo/vector-icons/Feather';
import { Link, useRouter } from 'expo-router';
import React from 'react';
import { Pressable, View } from 'react-native';

export function Updates() {
  const router = useRouter();
  
  function handlePress(){
    router.push('/updates');
  }
  
  return (
    <View className="container py-8">
      <View className="flex-row justify-between items-center mb-6">
        <TextStyled variant="h2" weight="bold">
          Updates
        </TextStyled>
        <Link href="/updates">
          <View className="flex-row items-center">
            <TextStyled color="primary" weight="semibold" className="mr-1">View All</TextStyled>
            <Feather name="arrow-right" size={16} color="#49291B" />
          </View>
        </Link>
      </View>
      
      <View className="md:flex-wrap md:flex-row gap-6">
        <UpdateCard 
          title="National Convention Recap" 
          date="Sep 8, 2025"
          category="National"
          description="Highlights from our annual national convention including new initiatives and leadership announcements."
          onPress={handlePress}
        />
        
        <UpdateCard 
          title="Chapter Achievement Award" 
          date="Sep 5, 2025"
          category="Recognition"
          description="Our chapter has been recognized for outstanding academic achievement and community service."
          onPress={handlePress}
        />
        
        <UpdateCard 
          title="New Member Orientation" 
          date="Aug 30, 2025"
          category="Chapter"
          description="Important information for new members about upcoming orientation sessions and requirements."
          onPress={handlePress}
        />
      </View>
    </View>
  );
}

function UpdateCard({ 
  title, 
  date, 
  category,
  description,
  onPress 
}: { 
  title: string; 
  date: string; 
  category: string;
  description: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} className="bg-white rounded-lg p-4 shadow-sm flex-1">
      <View className="flex-row justify-between items-start">
        <TextStyled variant="h4" weight="semibold" className="flex-1">
          {title}
        </TextStyled>
        <View className="bg-primary-500/10 px-3 py-1 rounded">
          <TextStyled color="primary" weight="semibold" variant="caption">
            {date}
          </TextStyled>
        </View>
      </View>
      
      <View className="flex-row items-center mb-2">
        <Feather name="tag" size={14} color="#49291B" className="mr-1" />
        <TextStyled variant="caption" color="muted">
          {category}
        </TextStyled>
      </View>
      
      <TextStyled className="mb-3">
        {description}
      </TextStyled>
      
      <View className="flex-row justify-end">
        <View className="bg-primary-500 px-3 py-1 rounded">
          <TextStyled color="white" weight="semibold" variant="caption">
            Read More
          </TextStyled>
        </View>
      </View>
    </Pressable>
  );
}
