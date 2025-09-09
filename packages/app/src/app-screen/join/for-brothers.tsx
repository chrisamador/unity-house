import React, { useState } from 'react';
import { View, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { TextStyled } from '@/ui/components/Text';
import { Button } from '@/ui/components/Button';

export function ForBrothers() {
  const [formState, setFormState] = useState({
    firstName: '',
    lastName: '',
    email: '',
    chapter: '',
    graduationYear: '',
    memberNumber: '',
    password: '',
    confirmPassword: '',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormState(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSubmit = () => {
    // Basic validation
    if (!formState.firstName || !formState.lastName || !formState.email || 
        !formState.chapter || !formState.memberNumber || !formState.password) {
      setError('Please fill in all required fields');
      return;
    }

    if (formState.password !== formState.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Submit the form
    setIsSubmitting(true);
    setError(null);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setSuccess(true);
      // In a real app, you would call an API here
      // api.auth.actions.registerBrother(formState)
    }, 1500);
  };

  if (success) {
    return (
      <View className="py-8 items-center">
        <View className="w-16 h-16 rounded-full bg-green-500 items-center justify-center mb-4">
          <TextStyled variant="h2" color="primary">✓</TextStyled>
        </View>
        <TextStyled variant="h3" weight="bold" className="mb-2 text-center">
          Registration Submitted
        </TextStyled>
        <TextStyled className="text-center mb-6">
          Your registration has been submitted successfully. A chapter administrator will review your information and approve your account.
        </TextStyled>
        <Button 
          variant="primary" 
          onPress={() => setSuccess(false)}
        >
          Register Another Brother
        </Button>
      </View>
    );
  }

  return (
    <View className="space-y-6">
      <View>
        <TextStyled variant="h3" weight="bold" className="mb-2">
          Brother Registration
        </TextStyled>
        <TextStyled className="mb-4">
          Complete this form to register as a brother of Lambda Theta Phi. This information will be verified by your chapter leadership.
        </TextStyled>
      </View>

      {error && (
        <View className="bg-red-100 p-4 rounded-lg">
          <TextStyled color="error">{error}</TextStyled>
        </View>
      )}

      <View className="space-y-4">
        {/* Personal Information */}
        <View className="space-y-2">
          <TextStyled variant="h4" weight="semibold">
            Personal Information
          </TextStyled>
          
          <View className="flex-row space-x-4">
            <View className="flex-1">
              <FormField
                label="First Name"
                value={formState.firstName}
                onChangeText={(value) => handleChange('firstName', value)}
                required
              />
            </View>
            <View className="flex-1">
              <FormField
                label="Last Name"
                value={formState.lastName}
                onChangeText={(value) => handleChange('lastName', value)}
                required
              />
            </View>
          </View>
          
          <FormField
            label="Email Address"
            value={formState.email}
            onChangeText={(value) => handleChange('email', value)}
            keyboardType="email-address"
            required
          />
        </View>

        {/* Fraternity Information */}
        <View className="space-y-2">
          <TextStyled variant="h4" weight="semibold">
            Fraternity Information
          </TextStyled>
          
          <FormField
            label="Chapter Name"
            value={formState.chapter}
            onChangeText={(value) => handleChange('chapter', value)}
            placeholder="e.g., Alpha Chapter"
            required
          />
          
          <View className="flex-row space-x-4">
            <View className="flex-1">
              <FormField
                label="Graduation Year"
                value={formState.graduationYear}
                onChangeText={(value) => handleChange('graduationYear', value)}
                keyboardType="numeric"
                placeholder="e.g., 2023"
              />
            </View>
            <View className="flex-1">
              <FormField
                label="Member Number"
                value={formState.memberNumber}
                onChangeText={(value) => handleChange('memberNumber', value)}
                placeholder="e.g., 1234"
                required
              />
            </View>
          </View>
        </View>

        {/* Account Information */}
        <View className="space-y-2">
          <TextStyled variant="h4" weight="semibold">
            Account Information
          </TextStyled>
          
          <FormField
            label="Password"
            value={formState.password}
            onChangeText={(value) => handleChange('password', value)}
            secureTextEntry
            required
          />
          
          <FormField
            label="Confirm Password"
            value={formState.confirmPassword}
            onChangeText={(value) => handleChange('confirmPassword', value)}
            secureTextEntry
            required
          />
        </View>

        <View className="pt-4">
          <Button 
            variant="primary" 
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <View className="flex-row items-center">
                <ActivityIndicator size="small" color="white" />
                <TextStyled color="primary" className="ml-2">Submitting...</TextStyled>
              </View>
            ) : (
              "Register"
            )}
          </Button>
        </View>
      </View>
    </View>
  );
}

interface FormFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  required?: boolean;
}

function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  required = false,
}: FormFieldProps) {
  return (
    <View className="mb-2">
      <TextStyled className="mb-1">
        {label} {required && <TextStyled color="error">*</TextStyled>}
      </TextStyled>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        className="border border-gray-300 rounded-md p-2 bg-white"
      />
    </View>
  );
}
