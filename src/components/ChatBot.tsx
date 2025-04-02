
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Message {
  id: number;
  text: string;
  isUser: boolean;
}

const ChatBot = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hello! I'm MediBot, your skin health assistant. How can I help you today?",
      isUser: false,
    },
  ]);
  const [input, setInput] = useState("");

  // Simplified bot responses for demo purposes
  const getBotResponse = (question: string): string => {
    const normalizedQuestion = question.toLowerCase();
    
    if (normalizedQuestion.includes("what is skin cancer")) {
      return "Skin cancer is the abnormal growth of skin cells, most often developing on skin exposed to the sun. There are three major types: basal cell carcinoma, squamous cell carcinoma, and melanoma. Early detection is key to successful treatment.";
    } else if (normalizedQuestion.includes("symptoms") || normalizedQuestion.includes("signs")) {
      return "Common signs of skin cancer include changes in existing moles, new growths, sores that don't heal, redness or swelling beyond a mole's border, itchiness, tenderness, or pain in a skin area, and changes in skin texture. Remember the ABCDE rule: Asymmetry, Border irregularity, Color changes, Diameter growth, and Evolution of moles.";
    } else if (normalizedQuestion.includes("prevent")) {
      return "Prevent skin cancer by limiting sun exposure especially between 10 AM and 4 PM, wearing sunscreen with SPF 30+ year-round, covering up with clothing, avoiding tanning beds, checking your skin regularly, and seeing a dermatologist annually for professional skin exams.";
    } else if (normalizedQuestion.includes("treatment")) {
      return "Skin cancer treatment depends on type, size, and location but may include surgery, radiation therapy, chemotherapy, immunotherapy, targeted therapy, or photodynamic therapy. Early detection leads to less invasive treatment and better outcomes.";
    } else {
      return "I don't have specific information about that. For accurate medical advice, please consult with a healthcare provider or dermatologist.";
    }
  };

  const handleSendMessage = () => {
    if (input.trim() === "") return;

    // Add user message
    const newUserMessage: Message = {
      id: messages.length + 1,
      text: input,
      isUser: true,
    };
    
    setMessages((prev) => [...prev, newUserMessage]);
    setInput("");
    
    // Simulate bot response after a short delay
    setTimeout(() => {
      const botResponse: Message = {
        id: messages.length + 2,
        text: getBotResponse(input),
        isUser: false,
      };
      setMessages((prev) => [...prev, botResponse]);
    }, 1000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  return (
    <Card className="w-full h-[500px] flex flex-col">
      <CardHeader className="bg-mediminds-blue text-white py-4">
        <CardTitle className="text-xl font-bold">MediBot Assistant</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0 flex flex-col">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`max-w-[80%] p-3 rounded-lg ${
                  message.isUser
                    ? "ml-auto bg-mediminds-blue text-white rounded-br-none"
                    : "bg-gray-100 text-gray-800 rounded-bl-none"
                }`}
              >
                {message.text}
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className="p-4 border-t flex">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about skin cancer..."
            className="flex-1"
          />
          <Button 
            onClick={handleSendMessage} 
            className="ml-2 bg-mediminds-blue hover:bg-mediminds-darkblue"
          >
            Send
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChatBot;
