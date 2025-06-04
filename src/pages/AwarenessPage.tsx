
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CancerInfoCard from "@/components/CancerInfoCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const AwarenessPage = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-2">Skin Cancer Awareness</h1>
          <p className="text-gray-600 max-w-3xl mx-auto">
            Understanding skin cancer is the first step towards prevention and early detection. 
            Learn about different types, causes, warning signs, and how to protect yourself.
          </p>
        </div>
        
        <Tabs defaultValue="types" className="max-w-5xl mx-auto">
          <TabsList className="grid w-full grid-cols-1 md:grid-cols-4 mb-8">
            <TabsTrigger value="types">Types</TabsTrigger>
            <TabsTrigger value="signs">Warning Signs</TabsTrigger>
            <TabsTrigger value="prevention">Prevention</TabsTrigger>
            <TabsTrigger value="treatment">Treatment</TabsTrigger>
          </TabsList>
          
          <TabsContent value="types" className="mt-0">
            <div className="bg-white p-6 rounded-lg shadow-md mb-8">
              <h2 className="text-2xl font-bold mb-4 text-mediminds-darkblue">Types of Skin Cancer</h2>
              <p className="mb-4">
                Skin cancer is the abnormal growth of skin cells, most often developing on skin exposed to the sun. 
                There are several types of skin cancer, each named after the type of skin cell from which they arise.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <CancerInfoCard
                title="Basal Cell Carcinoma"
                description="The most common type of skin cancer. It begins in the basal cells and rarely spreads to other parts of the body but can be disfiguring if not treated early."
                imageSrc="https://images.unsplash.com/photo-1608501821229-a1d2c74d7ea6?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
              />
              
              <CancerInfoCard
                title="Squamous Cell Carcinoma"
                description="The second most common type of skin cancer. It begins in the squamous cells and is more likely to spread than basal cell carcinoma if left untreated."
                imageSrc="https://images.unsplash.com/photo-1576671414121-aa2d063a1c32?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
              />
              
              <CancerInfoCard
                title="Melanoma"
                description="The most dangerous type of skin cancer. It begins in the melanocytes and can spread quickly to other parts of the body if not detected early."
                imageSrc="https://images.unsplash.com/photo-1582719471384-894fbb16e074?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
              />
            </div>
          </TabsContent>
          
          <TabsContent value="signs" className="mt-0">
            <div className="bg-white p-6 rounded-lg shadow-md mb-8">
              <h2 className="text-2xl font-bold mb-4 text-mediminds-darkblue">Warning Signs of Skin Cancer</h2>
              <p className="mb-4">
                Early detection of skin cancer greatly increases the chances for successful treatment. 
                Remember the ABCDE rule for examining moles and other skin growths:
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-mediminds-blue/10 p-4 rounded-lg">
                <h3 className="text-xl font-bold text-mediminds-darkblue mb-2">A</h3>
                <h4 className="font-semibold mb-2">Asymmetry</h4>
                <p>One half of the mole doesn't match the other half.</p>
              </div>
              
              <div className="bg-mediminds-blue/10 p-4 rounded-lg">
                <h3 className="text-xl font-bold text-mediminds-darkblue mb-2">B</h3>
                <h4 className="font-semibold mb-2">Border</h4>
                <p>The edges are irregular, ragged, notched, or blurred.</p>
              </div>
              
              <div className="bg-mediminds-blue/10 p-4 rounded-lg">
                <h3 className="text-xl font-bold text-mediminds-darkblue mb-2">C</h3>
                <h4 className="font-semibold mb-2">Color</h4>
                <p>The color is not uniform and may include different shades.</p>
              </div>
              
              <div className="bg-mediminds-blue/10 p-4 rounded-lg">
                <h3 className="text-xl font-bold text-mediminds-darkblue mb-2">D</h3>
                <h4 className="font-semibold mb-2">Diameter</h4>
                <p>The mole is larger than 6mm (about the size of a pencil eraser).</p>
              </div>
              
              <div className="bg-mediminds-blue/10 p-4 rounded-lg">
                <h3 className="text-xl font-bold text-mediminds-darkblue mb-2">E</h3>
                <h4 className="font-semibold mb-2">Evolving</h4>
                <p>The mole is changing in size, shape, color, or is bleeding or crusting.</p>
              </div>
            </div>
            
            <div className="mt-8 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    <strong>Remember:</strong> Not all skin cancers follow these rules. Be vigilant about any new skin growths or changes to existing moles and consult a dermatologist if you notice anything unusual.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="prevention" className="mt-0">
            <div className="bg-white p-6 rounded-lg shadow-md mb-8">
              <h2 className="text-2xl font-bold mb-4 text-mediminds-darkblue">Prevention Strategies</h2>
              <p className="mb-4">
                Most skin cancers are preventable. Taking proper precautions against sun exposure is the best way to reduce your risk.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-4">Sun Protection</h3>
                <ul className="space-y-3 list-disc pl-5">
                  <li>Apply broad-spectrum sunscreen with SPF 30+ every 2 hours</li>
                  <li>Wear protective clothing, hats, and sunglasses</li>
                  <li>Seek shade, especially between 10am and 4pm</li>
                  <li>Avoid tanning beds and sunlamps</li>
                  <li>Use extra caution near water, snow, and sand</li>
                </ul>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-4">Regular Skin Checks</h3>
                <ul className="space-y-3 list-disc pl-5">
                  <li>Examine your skin monthly for any changes</li>
                  <li>Pay attention to existing moles and freckles</li>
                  <li>Use mirrors to check hard-to-see areas</li>
                  <li>Visit a dermatologist annually for a professional skin exam</li>
                  <li>Use digital tools like MediMinds to track changes</li>
                </ul>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="treatment" className="mt-0">
            <div className="bg-white p-6 rounded-lg shadow-md mb-8">
              <h2 className="text-2xl font-bold mb-4 text-mediminds-darkblue">Treatment Options</h2>
              <p className="mb-4">
                Treatment for skin cancer depends on the type, size, location, and stage of the cancer. 
                Early detection leads to less invasive treatment and better outcomes.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <CancerInfoCard
                title="Surgery"
                description="Most common treatment for skin cancer. Several types include excisional surgery, Mohs surgery, curettage and electrodesiccation, and cryosurgery."
              />
              
              <CancerInfoCard
                title="Radiation Therapy"
                description="Uses high-energy rays to kill cancer cells. Often used when surgery isn't an option or as an additional treatment."
              />
              
              <CancerInfoCard
                title="Topical Treatments"
                description="Medications applied directly to the skin for certain early or superficial skin cancers, including 5-fluorouracil, imiquimod, and photodynamic therapy."
              />
              
              <CancerInfoCard
                title="Immunotherapy"
                description="Helps your immune system fight cancer. Often used for advanced skin cancers that have spread to other parts of the body."
              />
              
              <CancerInfoCard
                title="Targeted Therapy"
                description="Drugs that target specific abnormalities in cancer cells. Used for certain types of advanced or recurrent skin cancers."
              />
              
              <CancerInfoCard
                title="Chemotherapy"
                description="Uses drugs to kill cancer cells. May be applied topically, given orally, or injected for more advanced cases."
              />
            </div>
          </TabsContent>
        </Tabs>
      </main>
      
      <Footer />
    </div>
  );
};

export default AwarenessPage;
