
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const MLTechniquesExplanation = () => {
  return (
    <Card className="max-w-4xl mx-auto my-8 bg-gray-50">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-mediminds-darkblue">
          Our AI-Powered Skin Cancer Detection Techniques
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-gray-700">
        <section>
          <h3 className="text-xl font-semibold mb-2">Machine Learning Algorithms</h3>
          <p>
            Our skin cancer detection system leverages advanced machine learning techniques to analyze skin lesion images:
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-2">
            <li>
              <strong>Convolutional Neural Networks (CNN):</strong> Deep learning models specifically designed for image classification, 
              trained on thousands of dermatological images to identify skin cancer patterns.
            </li>
            <li>
              <strong>Transfer Learning:</strong> We utilize pre-trained models like ResNet or InceptionV3, 
              fine-tuned on specialized medical imaging datasets to improve accuracy.
            </li>
            <li>
              <strong>Multi-modal Analysis:</strong> Combining image analysis with symptom descriptions to enhance diagnostic accuracy.
            </li>
          </ul>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-2">Data Processing Techniques</h3>
          <ul className="list-disc pl-6 mt-2 space-y-2">
            <li>
              <strong>Image Preprocessing:</strong> Standardizing image size, color normalization, 
              and removing background noise to improve model performance.
            </li>
            <li>
              <strong>Feature Extraction:</strong> Advanced computer vision techniques to identify 
              critical features like mole borders, color variations, and texture.
            </li>
          </ul>
        </section>

        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-4">
          <p className="text-yellow-800">
            <strong>Disclaimer:</strong> Our AI is a screening tool and not a substitute for professional medical diagnosis. 
            Always consult with a healthcare professional for definitive medical advice.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default MLTechniquesExplanation;
