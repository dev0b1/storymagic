# Demo Videos Setup

This directory contains demo videos and thumbnails for showcasing PromptBook's narration modes on the landing page.

## Required Files

To complete the demo video integration, add the following files:

### Video Files (MP4 format recommended)
- `lecture-mode.mp4` - Demo showing educational content in lecture mode
- `guide-mode.mp4` - Demo showing step-by-step process in guide mode  
- `narrative-mode.mp4` - Demo showing creative content in narrative mode
- `podcast-mode.mp4` - Demo showing multi-voice discussion in podcast mode

### Thumbnail Images (JPG format recommended, 16:9 aspect ratio)
- `thumbnails/lecture.jpg` - Thumbnail for lecture mode demo
- `thumbnails/guide.jpg` - Thumbnail for guide mode demo
- `thumbnails/narrative.jpg` - Thumbnail for narrative mode demo
- `thumbnails/podcast.jpg` - Thumbnail for podcast mode demo

## Specifications

### Video Files
- **Format**: MP4 (H.264 codec recommended)
- **Duration**: 2-4 minutes each
- **Resolution**: 1280x720 (720p) or higher
- **Aspect Ratio**: 16:9
- **Audio**: Clear narration demonstrating each mode

### Thumbnails
- **Format**: JPG or PNG
- **Resolution**: 1280x720 pixels
- **Aspect Ratio**: 16:9
- **Content**: Representative frame from the video with mode indicator

## Content Suggestions

### Lecture Mode Demo
- Technical topic (e.g., "Machine Learning Basics")
- Clear, structured explanation
- Educational tone with pauses for comprehension

### Guide Mode Demo  
- Process explanation (e.g., "How to Set Up a Project")
- Step-by-step instructions
- Conversational, helpful tone

### Narrative Mode Demo
- Story-based content (e.g., "The History of Innovation") 
- Engaging storytelling approach
- Maintains accuracy while being entertaining

### Podcast Mode Demo
- Discussion format (e.g., "Tech Industry Insights")
- Multiple voices or interview style
- Natural conversation flow with sound effects

## File Placement

All files should be placed in the `/public/demos/` directory structure:

```
public/
├── demos/
│   ├── lecture-mode.mp4
│   ├── guide-mode.mp4
│   ├── narrative-mode.mp4
│   ├── podcast-mode.mp4
│   └── thumbnails/
│       ├── lecture.jpg
│       ├── guide.jpg  
│       ├── narrative.jpg
│       └── podcast.jpg
```

## Usage

The demo videos are integrated into the landing page via the `DemoVideosGrid` component and will automatically display once the files are added to the correct locations.

## Fallback

If demo videos are not available, the component will show placeholder content with instructions to add the video files.
