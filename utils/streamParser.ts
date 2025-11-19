import { TextPart, WidgetPart, WidgetConfig } from '../types';
import { WIDGET_START_TOKEN, WIDGET_END_TOKEN } from './chatProtocol';

/**
 * Parses the streaming chat content to separate natural language from widget configurations.
 * 
 * @param content The full message content string
 * @returns An array of parsed parts (text or widget)
 */
export function parseStreamedContent(content: string): (TextPart | WidgetPart)[] {
    const parts: (TextPart | WidgetPart)[] = [];
    let remaining = content;

    while (remaining.length > 0) {
        const startIndex = remaining.indexOf(WIDGET_START_TOKEN);

        // Case 1: No more widget tokens found
        if (startIndex === -1) {
            // Push the rest as text
            parts.push({ type: 'text', content: remaining });
            break;
        }

        // Case 2: Text precedes the widget token
        if (startIndex > 0) {
            parts.push({ type: 'text', content: remaining.substring(0, startIndex) });
        }

        // Move pointer to after the start token
        // We keep the pointer *relative to the original 'remaining' string* logic 
        // by slicing 'remaining'
        const afterStartToken = remaining.substring(startIndex + WIDGET_START_TOKEN.length);
        
        const endIndex = afterStartToken.indexOf(WIDGET_END_TOKEN);

        // Case 3: Incomplete widget block (still streaming)
        if (endIndex === -1) {
            // We have an open widget tag but no close tag.
            // We choose NOT to display the raw JSON being typed.
            // The UI can detect this state if needed to show a spinner, 
            // but for the parser, we return nothing for this part yet.
            break;
        }

        // Case 4: Complete widget block found
        let jsonString = afterStartToken.substring(0, endIndex).trim();
        
        // Clean up potential markdown code fences that LLMs sometimes add
        // e.g. ```json { ... } ```
        if (jsonString.startsWith('```')) {
             jsonString = jsonString.replace(/^```[a-z]*\s*/i, '').replace(/```$/, '');
        }

        try {
            const config = JSON.parse(jsonString) as WidgetConfig;
            parts.push({ type: 'widget', config });
        } catch (error) {
            console.warn("Failed to parse widget JSON:", error);
            // On failure, treat it as raw text so the user sees what happened
            // We reconstruct the tokens to show exactly what was received
            parts.push({ 
                type: 'text', 
                content: `${WIDGET_START_TOKEN}${afterStartToken.substring(0, endIndex)}${WIDGET_END_TOKEN}` 
            });
        }

        // Advance remaining past the end token
        remaining = afterStartToken.substring(endIndex + WIDGET_END_TOKEN.length);
    }

    return parts;
}

