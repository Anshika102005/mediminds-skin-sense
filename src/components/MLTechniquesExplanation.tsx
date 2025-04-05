
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const MLTechniquesExplanation = () => {
  return (
    <Card className="max-w-4xl mx-auto my-8 bg-gray-50">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-mediminds-darkblue">
          Skin Cancer Detection Using Machine Learning
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-gray-700">
        <section>
          <h3 className="text-xl font-semibold mb-2">Classification Algorithms</h3>
          <p>
            Our skin cancer detection system utilizes advanced machine learning classification algorithms to analyze skin lesion images:
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-2">
            <li>
              <strong>Convolutional Neural Networks (CNN):</strong> Deep learning models specifically designed for image classification, 
              trained on thousands of dermatological images to identify skin cancer patterns and categorize them accurately.
            </li>
            <li>
              <strong>Support Vector Machines (SVM):</strong> A powerful classification algorithm that helps differentiate between malignant 
              and benign skin lesions by finding optimal decision boundaries between different skin condition categories.
            </li>
            <li>
              <strong>Random Forest:</strong> An ensemble learning method that combines multiple decision trees to improve 
              classification accuracy and reduce overfitting when categorizing skin lesions.
            </li>
            <li>
              <strong>Transfer Learning:</strong> We leverage pre-trained models like ResNet or InceptionV3, 
              fine-tuned on specialized medical imaging datasets to improve classification accuracy.
            </li>
          </ul>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-2">Feature Extraction Techniques</h3>
          <ul className="list-disc pl-6 mt-2 space-y-2">
            <li>
              <strong>ABCDE Feature Analysis:</strong> Our algorithms extract asymmetry, border irregularity, color variation, 
              diameter, and evolving features from skin lesion images.
            </li>
            <li>
              <strong>Texture Analysis:</strong> Advanced algorithms analyze the texture patterns of skin lesions to identify 
              subtle differences between benign and malignant conditions.
            </li>
            <li>
              <strong>Deep Feature Extraction:</strong> Using the middle layers of neural networks to capture complex visual patterns 
              that may indicate cancerous development.
            </li>
          </ul>
        </section>

        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-4">
          <p className="text-yellow-800">
            <strong>Disclaimer:</strong> Our AI is a screening tool based on machine learning classification algorithms and not a substitute for professional medical diagnosis. 
            Always consult with a healthcare professional for definitive medical advice.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default MLTechniquesExplanation;
