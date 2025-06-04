
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";

const WarningSignsTabContent = () => {
  return (
    <Card>
      <CardContent className="pt-6">
        <h2 className="text-2xl font-bold text-mediminds-blue mb-4">Warning Signs</h2>
        
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-2">The ABCDE Rule of Melanoma</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>A - Asymmetry:</strong> One half of the mole doesn't match the other half.</li>
            <li><strong>B - Border:</strong> The edges are irregular, ragged, notched, or blurred.</li>
            <li><strong>C - Color:</strong> The color is not the same all over and may include different shades.</li>
            <li><strong>D - Diameter:</strong> The spot is larger than 6 millimeters across (about 1/4 inch).</li>
            <li><strong>E - Evolving:</strong> The mole is changing in size, shape, or color.</li>
          </ul>
        </div>
        
        <div>
          <h3 className="text-xl font-semibold mb-2">Other Warning Signs</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>Sores that don't heal</li>
            <li>Spread of pigment from the border of a spot into surrounding skin</li>
            <li>Redness or swelling beyond the border of a mole</li>
            <li>Change in sensation (itchiness, tenderness, or pain)</li>
            <li>Change in the surface of a mole (scaliness, oozing, bleeding, or appearance of a bump)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default WarningSignsTabContent;
