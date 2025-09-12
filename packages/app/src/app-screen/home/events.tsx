import { TextStyled } from '@/ui/components/Text';
import Feather from '@expo/vector-icons/Feather';
import { Link } from 'expo-router';
import { Pressable, View } from 'react-native';

export function Events() {
  return (
    <View className="container py-8">
      <View className="flex-row justify-between items-center mb-6">
        <TextStyled variant="h2" weight="bold">
          Events
        </TextStyled>
        <Link href="/events">
          <View className="flex-row items-center">
            <TextStyled color="primary" weight="semibold" className="mr-1">View All</TextStyled>
            <Feather name="arrow-right" size={16} color="#49291B" />
          </View>
        </Link>
      </View>
      
      
      <View className="md:flex-wrap md:flex-row gap-6">
        <EventCard 
          title="Fall 2025 Lambda Week" 
          date="Sep 15-19, 2025" 
          location="Student Union Building"
          description="Join us for our Fall 2025 Lambda Week! Meet the brothers and learn about our fraternity's values and traditions."
        />
        
        <EventCard 
          title="Community Service: Park Cleanup" 
          date="Sep 22, 2025" 
          location="Riverside Park"
          description="Help us make a difference in our community by participating in our monthly park cleanup event."
        />
        
        <EventCard 
          title="Professional Development Workshop" 
          date="Oct 5, 2025" 
          location="Business School, Room 203"
          description="Resume building and interview preparation workshop with alumni professionals."
        />
      </View>
    </View>
  );
}

function EventCard({ 
  title, 
  date, 
  location, 
  description 
}: { 
  title: string; 
  date: string; 
  location: string;
  description: string;
}) {
  return (
    <Pressable className="bg-white rounded-lg p-4 shadow-sm flex-1">
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
        <Feather name="map-pin" size={14} color="#49291B" className="mr-1" />
        <TextStyled variant="caption" color="muted">
          {location}
        </TextStyled>
      </View>
      
      <TextStyled className="mb-3">
        {description}
      </TextStyled>
      
      <View className="flex-row justify-end">
        <View className="bg-primary-500 px-3 py-1 rounded">
          <TextStyled color="white" weight="semibold" variant="caption">
            Learn More
          </TextStyled>
        </View>
      </View>
    </Pressable>
  );
}
