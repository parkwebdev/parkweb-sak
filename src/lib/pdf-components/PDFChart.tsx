/**
 * PDF Chart Component
 * 
 * Renders charts in PDF using SVG strings extracted from Recharts.
 * Falls back to Image for raster captures.
 */

import { View, Image, StyleSheet } from '@react-pdf/renderer';
import { SPACING } from './styles';
import { SvgFromString } from './svg/SvgFromString';

const chartStyles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: SPACING.MD,
  },

  image: {
    width: '100%',
    objectFit: 'contain',
  },
});

interface PDFChartProps {
  /** SVG string extracted from Recharts */
  svgString?: string;
  /** Fallback raster data URL (legacy) */
  imageDataUrl?: string;
  /** Maximum height in points */
  maxHeight?: number;
}

export function PDFChart({ svgString, imageDataUrl, maxHeight = 200 }: PDFChartProps) {
  if (svgString) {
    const svgElement = <SvgFromString svgString={svgString} maxHeight={maxHeight} />;
    // If SVG parsing failed, SvgFromString returns null
    if (svgElement) {
      return (
        <View style={chartStyles.container}>
          {svgElement}
        </View>
      );
    }
    // Fall through to placeholder if SVG failed
  }

  if (imageDataUrl) {
    return (
      <View style={chartStyles.container}>
        <Image src={imageDataUrl} style={[chartStyles.image, { maxHeight }]} />
      </View>
    );
  }

  // Return placeholder when no valid chart data
  return <PDFChartPlaceholder title="Chart" />;
}

/**
 * Simple chart placeholder for when SVG extraction isn't available.
 * Shows a message indicating charts are available in the web view.
 */
export function PDFChartPlaceholder({ title }: { title: string }) {
  return (
    <View style={[chartStyles.container, { 
      height: 80, 
      backgroundColor: '#f8fafc', 
      borderRadius: 4,
      justifyContent: 'center',
      alignItems: 'center',
    }]}>
      {/* Placeholder text handled by parent */}
    </View>
  );
}
