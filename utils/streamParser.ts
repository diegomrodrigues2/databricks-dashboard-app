import { TextPart, WidgetPart, WidgetConfig } from '../types';
import { WIDGET_START_TOKEN, WIDGET_END_TOKEN } from './chatProtocol';

type ParseState = 'TEXT' | 'THOUGHT' | 'COMMAND' | 'WIDGET';

export interface ParsedStreamResult {
    parts: (TextPart | WidgetPart)[];
    thought?: string;
    command?: {
        tool: string;
        params: string;
    };
}

/**
 * Parses the streaming chat content to separate natural language, thoughts, commands, and widgets.
 * Uses a simple state machine approach to handle XML-like tags.
 * 
 * @param content The full message content string
 * @returns Parsed structure containing display parts and internal state
 */
export function parseStreamedContent(content: string): ParsedStreamResult {
    const parts: (TextPart | WidgetPart)[] = [];
    let thought = '';
    let command: { tool: string; params: string } | undefined;
    
    // Regex definitions
    const THOUGHT_START = /<thought>/;
    const THOUGHT_END = /<\/thought>/;
    const COMMAND_START = /<command\s+tool="([^"]+)">/;
    const COMMAND_END = /<\/command>/;
    
    let remaining = content;

    while (remaining.length > 0) {
        // Find earliest occurrence of any tag
        const thoughtMatch = remaining.match(THOUGHT_START);
        const commandMatch = remaining.match(COMMAND_START);
        const widgetStartIdx = remaining.indexOf(WIDGET_START_TOKEN);

        let nextTagIdx = -1;
        let nextTagType: ParseState = 'TEXT';
        
        // Determine which tag comes first
        if (thoughtMatch && thoughtMatch.index !== undefined) {
            nextTagIdx = thoughtMatch.index;
            nextTagType = 'THOUGHT';
        }
        
        if (commandMatch && commandMatch.index !== undefined) {
            if (nextTagIdx === -1 || commandMatch.index < nextTagIdx) {
                nextTagIdx = commandMatch.index;
                nextTagType = 'COMMAND';
            }
        }
        
        if (widgetStartIdx !== -1) {
            if (nextTagIdx === -1 || widgetStartIdx < nextTagIdx) {
                nextTagIdx = widgetStartIdx;
                nextTagType = 'WIDGET';
            }
        }
        
        // If no tags found, everything remaining is text
        if (nextTagIdx === -1) {
            if (remaining.trim()) {
                parts.push({ type: 'text', content: remaining });
            }
            break;
        }

        // Push preceding text if any
        if (nextTagIdx > 0) {
            const textContent = remaining.substring(0, nextTagIdx);
            if (textContent) {
                parts.push({ type: 'text', content: textContent });
            }
        }
        
        // Handle the found tag
        if (nextTagType === 'THOUGHT') {
            const endMatch = remaining.substring(nextTagIdx).match(THOUGHT_END);
            if (endMatch && endMatch.index !== undefined) {
                const fullThoughtBlock = remaining.substring(nextTagIdx, nextTagIdx + endMatch.index + endMatch[0].length);
                const thoughtContent = fullThoughtBlock.replace(THOUGHT_START, '').replace(THOUGHT_END, '');
                thought = thoughtContent.trim();
                remaining = remaining.substring(nextTagIdx + fullThoughtBlock.length);
            } else {
                // Incomplete thought block - treat as text or hidden state?
                // For now, let's assume we want to see partial thoughts if we were streaming them differently,
                // but here we just extract what we can or wait.
                // To be robust for streaming, if we don't find the end tag, we might be in the middle of it.
                // Current simple logic: break loop if incomplete tag to wait for more data (except we are parsing full content every time)
                // If it's the end of the stream, we might just take the rest as thought.
                 const thoughtContent = remaining.substring(nextTagIdx).replace(THOUGHT_START, '');
                 thought = thoughtContent.trim();
                 remaining = ''; // Consumed rest
            }
        } else if (nextTagType === 'COMMAND') {
            // Re-match to get capture groups
            const specificCommandMatch = remaining.substring(nextTagIdx).match(COMMAND_START);
            if (!specificCommandMatch) break; // Should not happen
            
            const toolName = specificCommandMatch[1];
            const endMatch = remaining.substring(nextTagIdx).match(COMMAND_END);
            
            if (endMatch && endMatch.index !== undefined) {
                 const fullCommandBlock = remaining.substring(nextTagIdx, nextTagIdx + endMatch.index + endMatch[0].length);
                 const paramsContent = fullCommandBlock
                    .substring(specificCommandMatch[0].length, fullCommandBlock.length - endMatch[0].length)
                    .trim();
                 
                 command = { tool: toolName, params: paramsContent };
                 remaining = remaining.substring(nextTagIdx + fullCommandBlock.length);
            } else {
                // Incomplete command
                remaining = '';
            }
        } else if (nextTagType === 'WIDGET') {
            const afterStart = remaining.substring(nextTagIdx + WIDGET_START_TOKEN.length);
            const endIdx = afterStart.indexOf(WIDGET_END_TOKEN);
            
            if (endIdx !== -1) {
                let jsonString = afterStart.substring(0, endIdx).trim();
                
                // Clean up markdown code fences
        if (jsonString.startsWith('```')) {
             jsonString = jsonString.replace(/^```[a-z]*\s*/i, '').replace(/```$/, '');
        }

        try {
            const config = JSON.parse(jsonString) as WidgetConfig;
            parts.push({ type: 'widget', config });
        } catch (error) {
            console.warn("Failed to parse widget JSON:", error);
            parts.push({ 
                type: 'text', 
                        content: `${WIDGET_START_TOKEN}${afterStart.substring(0, endIdx)}${WIDGET_END_TOKEN}` 
            });
        }
                remaining = afterStart.substring(endIdx + WIDGET_END_TOKEN.length);
            } else {
                // Incomplete widget
                 remaining = '';
            }
        }
    }

    return { parts, thought, command };
}
