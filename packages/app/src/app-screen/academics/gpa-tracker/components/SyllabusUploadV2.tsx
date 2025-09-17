import { Button } from '@/ui/components/Button';
import { TextStyled } from '@/ui/components/Text';
import { TextInput } from '@/ui/components/TextInput';
import Feather from '@expo/vector-icons/Feather';
import { api } from '@unity-house/api/convex/_generated/api';
import { Id } from '@unity-house/api/convex/_generated/dataModel';
import { useAction, useMutation } from 'convex/react';
import * as DocumentPicker from 'expo-document-picker';
import React, { useState } from 'react';
import { Platform, Pressable, ScrollView, View } from 'react-native';

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

interface ProcessingState {
  status: 'idle' | 'uploading' | 'processing' | 'complete' | 'error';
  message: string;
  progress: number;
}

export function SyllabusUploadV2() {
  // File state
  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [processingState, setProcessingState] = useState<ProcessingState>({
    status: 'idle',
    message: '',
    progress: 0
  });
  
  // Extracted data state
  const [courseInfo, setCourseInfo] = useState<ExtractedCourseInfo | null>(null);
  const [assignments, setAssignments] = useState<ExtractedAssignment[]>([]);
  const [editingAssignmentIndex, setEditingAssignmentIndex] = useState<number | null>(null);
  const [courseId, setCourseId] = useState<Id<'courses'> | null>(null);
  
  // Convex mutations and actions
  const generateUploadUrl = useMutation(api.gpa.courses.generateUploadUrl);
  const createSyllabus = useMutation(api.gpa.courses.createSyllabus);
  const extractAssignments = useAction(api.gpa.ai.extractAssignments);
  const processSyllabus = useMutation(api.gpa.courses.processSyllabus);
  const updateSyllabusInfo = useMutation(api.gpa.courses.updateSyllabusInfo);
  const getFileUrl = useAction(api.gpa.courses.getFileUrl);
  
  
  // Handle file selection
  const handleFilePick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'text/plain'],
        copyToCacheDirectory: true,
      });
      
      if (result.canceled) {
        return;
      }
      
      const file = result.assets[0];
      
      // Check if file is PDF or TXT
      const fileType = file.mimeType;
      if (fileType !== 'application/pdf' && fileType !== 'text/plain') {
        alert('Please select a PDF or TXT file');
        return;
      }
      
      setSelectedFile(file);
      
      // Start upload process immediately
      await handleUploadAndProcess(file);
    } catch (error) {
      console.error('Error picking document:', error);
      alert('Error selecting file. Please try again.');
    }
  };
  
  // Combined upload and process function
  const handleUploadAndProcess = async (asset: DocumentPicker.DocumentPickerAsset) => {
    setProcessingState({
      status: 'uploading',
      message: 'Uploading syllabus...',
      progress: 10
    });
    
    try {
      const file = asset.file;
      if (!file) {
        throw new Error('File not found');
      }
      // Get upload URL from Convex
      const uploadUrl = await generateUploadUrl();
      
      // Create form data for file upload
      const formData = new FormData();
      
      // Ensure file name has the correct extension
      let fileName = file.name;
      const fileExtension = fileName.split('.').pop()?.toLowerCase();
      
      // If no extension is found, add one based on mimeType
      if (!fileExtension) {
        if (file.type === 'application/pdf') {
          fileName = `${fileName}.pdf`;
        } else if (file.type === 'text/plain') {
          fileName = `${fileName}.txt`;
        }
      }
      
      // formData.append('file', {
      //   uri: file.uri,
      //   name: fileName,
      //   type: file.mimeType,
      // } as unknown as Blob);
      
      // Upload file to Convex storage
      const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      
      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file');
      }

      // debugger;
      
      const { storageId } = await uploadResponse.json();
      
      setProcessingState({
        status: 'processing',
        message: 'Creating syllabus record...',
        progress: 40
      });
      
      // Create initial course record with syllabus info
      const newCourseId = await createSyllabus({
        courseName: 'Processing...',
        courseCode: 'Processing...',
        semester: 'Processing...',
        year: new Date().getFullYear(),
        fileId: storageId,
        fileName: fileName, // Use the corrected file name with extension
      });
      
      setCourseId(newCourseId);

      const fileUrl = await getFileUrl({ fileId: storageId });
      
      // Set file URL for preview
      setFileUrl(fileUrl);
      
      setProcessingState({
        status: 'processing',
        message: 'Extracting information from syllabus...',
        progress: 60
      });

      console.log("processing assignments", { newCourseId })
      
      // Extract information from syllabus
      const extractionResult = await extractAssignments({ courseId: newCourseId });
      console.log("processing assignments", { extractionResult })
      // Format assignments
      const formattedAssignments = extractionResult.assignments.map(assignment => ({
        ...assignment,
        dueDate: assignment.dueDate || undefined,
        category: assignment.category || undefined,
        maxPoints: assignment.maxPoints || undefined
      }));
      console.log("formattedAssignments", { formattedAssignments })
      
      setCourseInfo(extractionResult.courseInfo);
      setAssignments(formattedAssignments);
      console.log("complete")
      setProcessingState({
        status: 'complete',
        message: 'Processing complete!',
        progress: 100
      });
    } catch (error) {
      console.error('Error processing syllabus:', error);
      setProcessingState({
        status: 'error',
        message: 'Error processing syllabus. Please try again.',
        progress: 0
      });
    }
  };
  
  // Handle saving the extracted and possibly edited information
  const handleSave = async () => {
    if (!courseId) return;
    
    try {
      setProcessingState({
        status: 'processing',
        message: 'Saving information...',
        progress: 80
      });
      
      // Update course info if available
      if (courseInfo) {
        const updateData: any = {};
        if (courseInfo.name) updateData.courseName = courseInfo.name;
        if (courseInfo.code) updateData.courseCode = courseInfo.code;
        if (courseInfo.semester) updateData.semester = courseInfo.semester;
        if (courseInfo.year) updateData.year = courseInfo.year;
        
        if (Object.keys(updateData).length > 0) {
          await updateSyllabusInfo({
            courseId,
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
        courseId,
        assignments: processedAssignments
      });
      
      setProcessingState({
        status: 'complete',
        message: 'Syllabus saved successfully!',
        progress: 100
      });
      
      // Reset form after short delay
      setTimeout(() => {
        setSelectedFile(null);
        setFileUrl(null);
        setCourseId(null);
        setCourseInfo(null);
        setAssignments([]);
        setProcessingState({
          status: 'idle',
          message: '',
          progress: 0
        });
      }, 2000);
      
    } catch (error) {
      console.error('Error saving syllabus data:', error);
      setProcessingState({
        status: 'error',
        message: 'Error saving syllabus data. Please try again.',
        progress: 0
      });
    }
  };
  
  // Helper functions for assignments
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
  
  // Render the upload interface when no file is selected
  const renderUploadInterface = () => (
    <View className="bg-white border border-gray-200 p-6 rounded-lg">
      <TextStyled className="mb-4">
        Upload your course syllabus to automatically extract assignments and track your grades.
        Supported file formats: PDF, TXT.
      </TextStyled>
      
      {/* Drag and drop area */}
      <View className="border-2 border-dashed border-gray-300 rounded-lg p-10 items-center justify-center mb-6">
        <Pressable 
          onPress={handleFilePick}
          className="items-center"
        >
          <Feather name="upload-cloud" size={60} color="#6B7280" />
          <TextStyled className="mt-4 text-center font-semibold">
            Click or drag to upload a syllabus
          </TextStyled>
          <TextStyled color="muted" className="mt-2 text-center">
            PDF or TXT files only
          </TextStyled>
        </Pressable>
      </View>
    </View>
  );
  
  // Render processing state
  const renderProcessingState = () => (
    <View className="bg-white border border-gray-200 p-6 rounded-lg items-center">
      <Feather name={
        processingState.status === 'uploading' ? 'upload-cloud' :
        processingState.status === 'processing' ? 'cpu' :
        processingState.status === 'complete' ? 'check-circle' : 'alert-circle'
      } size={60} color={
        processingState.status === 'error' ? '#EF4444' : '#4F46E5'
      } />
      
      <TextStyled className="mt-4 text-center font-semibold">
        {processingState.message}
      </TextStyled>
      
      {/* Progress bar */}
      {(processingState.status === 'uploading' || processingState.status === 'processing') && (
        <View className="w-full h-2 bg-gray-200 rounded-full mt-4">
          <View 
            className="h-2 bg-primary-500 rounded-full" 
            style={{ width: `${processingState.progress}%` }} 
          />
        </View>
      )}
      
      {processingState.status === 'error' && (
        <Button
          variant="primary"
          size="md"
          onPress={handleFilePick}
          className="mt-4"
        >
          Try Again
        </Button>
      )}
    </View>
  );
  
  // Render the side-by-side interface
  const renderSideBySideInterface = () => (
    <View className="bg-white border border-gray-200 rounded-lg">
      <View className="flex-row border-b border-gray-200">
        <TextStyled variant="h4" weight="semibold" className="p-4">
          Review Extracted Information
        </TextStyled>
      </View>
      
      <View className="md:flex-row">
        {/* Left panel - PDF preview */}
        <View className="md:w-1/2 border-r border-gray-200 p-4">
          <TextStyled weight="semibold" className="mb-4">Syllabus Preview</TextStyled>
          
          {fileUrl && selectedFile?.mimeType === 'application/pdf' && Platform.OS === 'web' ? (
            <iframe 
              src={fileUrl}
              className="w-full h-[600px] border-0"
              title="PDF Preview"
            />
          ) : fileUrl && selectedFile?.mimeType === 'text/plain' ? (
            <View className="w-full h-[600px] bg-gray-50 p-4 overflow-auto">
              <TextStyled>Text preview not available</TextStyled>
            </View>
          ) : (
            <View className="w-full h-[600px] bg-gray-50 items-center justify-center">
              <Feather name="file-text" size={60} color="#9CA3AF" />
              <TextStyled color="muted" className="mt-2">
                Preview not available
              </TextStyled>
              {selectedFile && (
                <Button
                  variant="outline"
                  size="sm"
                  onPress={() => {
                    if (Platform.OS === 'web' && selectedFile) {
                      window.open(URL.createObjectURL(selectedFile as any), '_blank');
                    }
                  }}
                  className="mt-4"
                >
                  Open in New Tab
                </Button>
              )}
            </View>
          )}
        </View>
        
        {/* Right panel - Extracted information */}
        <View className="md:w-1/2 p-4">
          <ScrollView className="h-[600px]">
            {/* Course Info Section */}
            <View className="space-y-4 mb-6">
              <TextStyled weight="semibold">Course Information</TextStyled>
              
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
                <TextStyled weight="semibold">Assignments ({assignments.length})</TextStyled>
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
                          <TextInput
                            label="Assignment Name"
                            value={assignment.name}
                            onChangeText={(text) => handleUpdateAssignment(index, 'name', text)}
                            placeholder="Assignment Name"
                          />
                          
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
          </ScrollView>
        </View>
      </View>
      
      {/* Action buttons */}
      <View className="flex-row justify-end p-4 border-t border-gray-200 space-x-4">
        <Button
          variant="outline"
          size="md"
          onPress={() => {
            setSelectedFile(null);
            setFileUrl(null);
            setCourseId(null);
            setCourseInfo(null);
            setAssignments([]);
            setProcessingState({
              status: 'idle',
              message: '',
              progress: 0
            });
          }}
        >
          Cancel
        </Button>
        
        <Button
          variant="primary"
          size="md"
          onPress={handleSave}
        >
          Confirm & Save
        </Button>
      </View>
    </View>
  );
  
  return (
    <View className="space-y-6">
      <TextStyled variant="h3" weight="semibold" className="mb-2">
        Upload Syllabus
      </TextStyled>
      
      {/* Render appropriate interface based on state */}
      {!selectedFile && processingState.status === 'idle' && renderUploadInterface()}
      {(processingState.status === 'uploading' || processingState.status === 'processing' || processingState.status === 'error') && renderProcessingState()}
      {selectedFile && processingState.status === 'complete' && renderSideBySideInterface()}
    </View>
  );
}
