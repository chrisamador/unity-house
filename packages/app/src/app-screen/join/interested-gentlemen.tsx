import React from 'react';
import { View, Image } from 'react-native';
import { TextStyled } from '@/ui/components/Text';
import { Button } from '@/ui/components/Button';

export function InterestedGentlemen() {
  return (
    <View className="space-y-6">
      {/* Hero section */}
      <View className="bg-primary-900/10 p-6 rounded-lg">
        <TextStyled variant="h3" weight="bold" className="mb-2">
          Become a Lambda Man
        </TextStyled>
        <TextStyled className="mb-4">
          Lambda Theta Phi Latin Fraternity, Inc. is looking for ambitious Latino men who are committed to academic excellence, leadership development, and community service.
        </TextStyled>
        <Button 
          variant="primary" 
          onPress={() => {}} 
          className="self-start"
        >
          Contact Us
        </Button>
      </View>

      {/* Requirements section */}
      <View className="space-y-4">
        <TextStyled variant="h4" weight="semibold">
          Membership Requirements
        </TextStyled>
        <View className="space-y-2">
          <RequirementItem text="Be enrolled as a full-time student at an accredited college or university" />
          <RequirementItem text="Have a minimum GPA of 2.5 on a 4.0 scale" />
          <RequirementItem text="Demonstrate leadership potential and commitment to community service" />
          <RequirementItem text="Uphold the values of academic excellence, brotherhood, leadership, Latino unity, and service" />
        </View>
      </View>

      {/* Process section */}
      <View className="space-y-4">
        <TextStyled variant="h4" weight="semibold">
          Joining Process
        </TextStyled>
        <View className="space-y-4">
          <ProcessStep 
            number="1" 
            title="Attend an Interest Meeting" 
            description="Learn about our history, values, and brotherhood. Check our calendar for upcoming events."
          />
          <ProcessStep 
            number="2" 
            title="Meet the Brothers" 
            description="Get to know our chapter members and learn about their experiences in Lambda Theta Phi."
          />
          <ProcessStep 
            number="3" 
            title="Complete the Application" 
            description="Submit your application with academic records and references."
          />
          <ProcessStep 
            number="4" 
            title="Education Program" 
            description="Selected candidates participate in our education program to learn about our history, values, and traditions."
          />
          <ProcessStep 
            number="5" 
            title="Initiation" 
            description="Successful candidates are initiated into the brotherhood of Lambda Theta Phi."
          />
        </View>
      </View>

      {/* FAQ section */}
      <View className="space-y-4">
        <TextStyled variant="h4" weight="semibold">
          Frequently Asked Questions
        </TextStyled>
        <View className="space-y-4">
          <FAQItem 
            question="Do I need to be Latino to join?" 
            answer="While we are a Latino-focused fraternity, we welcome men of all backgrounds who support our mission of Latino empowerment and cultural awareness."
          />
          <FAQItem 
            question="Is there hazing?" 
            answer="Lambda Theta Phi has a strict no-hazing policy. Our education program focuses on personal development, leadership, and brotherhood."
          />
          <FAQItem 
            question="How much time commitment is required?" 
            answer="Members are expected to attend weekly meetings and participate in chapter events. The specific time commitment varies but academics always come first."
          />
        </View>
      </View>

      {/* Contact section */}
      <View className="bg-primary-900/10 p-6 rounded-lg">
        <TextStyled variant="h4" weight="semibold" className="mb-2">
          Ready to Take the Next Step?
        </TextStyled>
        <TextStyled className="mb-4">
          Contact our Recruitment Chair to learn more about upcoming events and how to get involved with Lambda Theta Phi.
        </TextStyled>
        <Button 
          variant="primary" 
          onPress={() => {}} 
          className="self-start"
        >
          Contact Recruitment Chair
        </Button>
      </View>
    </View>
  );
}

function RequirementItem({ text }: { text: string }) {
  return (
    <View className="flex-row items-start">
      <View className="w-2 h-2 rounded-full bg-primary-500 mt-1.5 mr-2" />
      <TextStyled>{text}</TextStyled>
    </View>
  );
}

function ProcessStep({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <View className="flex-row">
      <View className="w-8 h-8 rounded-full bg-primary-500 items-center justify-center mr-3">
        <TextStyled color="primary" weight="bold">{number}</TextStyled>
      </View>
      <View className="flex-1">
        <TextStyled weight="semibold" className="mb-1">{title}</TextStyled>
        <TextStyled color="muted">{description}</TextStyled>
      </View>
    </View>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <View>
      <TextStyled weight="semibold" className="mb-1">{question}</TextStyled>
      <TextStyled color="muted">{answer}</TextStyled>
    </View>
  );
}
