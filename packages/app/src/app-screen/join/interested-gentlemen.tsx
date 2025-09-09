import { Button } from '@/ui/components/Button';
import { TextStyled } from '@/ui/components/Text';
import Feather from '@expo/vector-icons/Feather';
import React, { useState } from 'react';
import { Linking, Pressable, View } from 'react-native';
// import { JoinCTAs } from './for-brothers';

export function InterestedGentlemen() {
  // State to track which accordion section is open
  const [openSection, setOpenSection] = useState<string | null>('');

  // Function to toggle sections
  const toggleSection = (section: string) => {
    if (openSection === section) {
      // If clicking on already open section, close it
      setOpenSection(null);
    } else {
      // Otherwise open the clicked section and close others
      setOpenSection(section);
    }
  };

  return (
    <View className="space-y-6">
      {/* Hero section */}
      <View className="bg-primary-800/10 p-6 rounded-lg mb-6">
        <TextStyled variant="h3" color="primary" weight="bold" className="mb-2">
          Become a Lambda Man
        </TextStyled>
        <TextStyled>
          Lambda Theta Phi Latin Fraternity, Inc. is looking for ambitious Latino men who are
          committed to academic excellence, leadership development, and community service.
        </TextStyled>
      </View>

      {/* Requirements section - Accordion */}
      <View className="border border-gray-200 rounded-lg overflow-hidden mb-6">
        <Pressable
          onPress={() => toggleSection('requirements')}
          className={`flex-row justify-between items-center p-4 ${openSection === 'requirements' ? 'bg-primary-500/10' : 'bg-white'}`}
        >
          <TextStyled
            variant="h4"
            weight="semibold"
            color={openSection === 'requirements' ? 'primary' : 'default'}
          >
            Membership Requirements
          </TextStyled>
          <Feather
            name={openSection === 'requirements' ? 'chevron-up' : 'chevron-down'}
            size={20}
            color="#49291B"
          />
        </Pressable>

        {openSection === 'requirements' && (
          <View className="p-4 bg-white border-t border-gray-200">
            <View className="gap-2 mt-2">
              <RequirementItem text="Be enrolled as a full-time student at an accredited college or university" />
              <RequirementItem text="Have a minimum GPA of 2.5 on a 4.0 scale" />
              <RequirementItem text="Demonstrate leadership potential and commitment to community service" />
              <RequirementItem text="Uphold the values of academic excellence, brotherhood, leadership, Latino unity, and service" />
            </View>
          </View>
        )}
      </View>

      {/* Process section - Accordion */}
      <View className="border border-gray-200 rounded-lg overflow-hidden mb-6">
        <Pressable
          onPress={() => toggleSection('process')}
          className={`flex-row justify-between items-center p-4 ${openSection === 'process' ? 'bg-primary-500/10' : 'bg-white'}`}
        >
          <TextStyled
            variant="h4"
            weight="semibold"
            color={openSection === 'process' ? 'primary' : 'default'}
          >
            Joining Process
          </TextStyled>
          <Feather
            name={openSection === 'process' ? 'chevron-up' : 'chevron-down'}
            size={20}
            color="#49291B"
          />
        </Pressable>

        {openSection === 'process' && (
          <View className="p-4 bg-white border-t border-gray-200 mb-6">
            <View className="space-y-4 mt-2">
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
        )}
      </View>

      {/* FAQ section - Accordion */}
      <View className="border border-gray-200 rounded-lg overflow-hidden mb-6">
        <Pressable
          onPress={() => toggleSection('faq')}
          className={`flex-row justify-between items-center p-4 ${openSection === 'faq' ? 'bg-primary-500/10' : 'bg-white'}`}
        >
          <TextStyled
            variant="h4"
            weight="semibold"
            color={openSection === 'faq' ? 'primary' : 'default'}
          >
            Frequently Asked Questions
          </TextStyled>
          <Feather
            name={openSection === 'faq' ? 'chevron-up' : 'chevron-down'}
            size={20}
            color="#49291B"
          />
        </Pressable>

        {openSection === 'faq' && (
          <View className="p-4 bg-white border-t border-gray-200">
            <View className="gap-4 mt-2">
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
        )}
      </View>

      {/* Contact section */}
      <View className="bg-primary-800/10  p-6 rounded-lg gap-4 mb-12">
        <TextStyled variant="h4" weight="semibold" className="mb-2">
          Ready to Take the Next Step?
        </TextStyled>
        <TextStyled>
          Email our Recruitment Chair to learn more about upcoming events and how to get involved
          with Lambda Theta Phi.
        </TextStyled>
        {/* Email button */}
        <Button
          variant="primary"
          size="lg"
          onPress={() => {
            Linking.openURL('mailto:vas1lambdas1975@gmail.com');
          }}
        >
          Email Us
        </Button>
        <View className="items-center">
          <TextStyled color="primary">vas1lambdas1975@gmail.com</TextStyled>
        </View>
      </View>
      {/* <JoinCTAs /> */}
    </View>
  );
}

function RequirementItem({ text }: { text: string }) {
  return (
    <View className="flex-row gap-1">
      <View className="w-2 h-2 rounded-full bg-primary-500 mt-2 mr-2" />
      <TextStyled color="primary">{text}</TextStyled>
    </View>
  );
}

function ProcessStep({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <View className="flex-row">
      <View className="w-8 h-8 rounded-full bg-primary-500 items-center justify-center mr-3">
        <TextStyled color="white" weight="bold">
          {number}
        </TextStyled>
      </View>
      <View className="flex-1">
        <TextStyled weight="semibold" className="mb-1">
          {title}
        </TextStyled>
        <TextStyled color="muted">{description}</TextStyled>
      </View>
    </View>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <View>
      <TextStyled weight="semibold" className="mb-1">
        {question}
      </TextStyled>
      <TextStyled color="muted">{answer}</TextStyled>
    </View>
  );
}
