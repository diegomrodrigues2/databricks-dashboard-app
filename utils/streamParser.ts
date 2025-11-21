import { TextPart, WidgetPart, WidgetConfig } from '../types';
import { WIDGET_START_TOKEN, WIDGET_END_TOKEN } from './chatProtocol';

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
 * Uses a lexical tokenizer approach to handle XML-like tags and Markdown blocks.
 * 
 * @param content The full message content string
 * @returns Parsed structure containing display parts and internal state
 */
export function parseStreamedContent(content: string): ParsedStreamResult {
    const parts: (TextPart | WidgetPart)[] = [];
    let thought = '';
    let command: { tool: string; params: string } | undefined;

    let cursor = 0;
    const length = content.length;

    while (cursor < length) {
        const remaining = content.slice(cursor);
        
        // Find next potential tag start
        const thoughtStart = remaining.indexOf('<thought>');
        const commandMatch = remaining.match(/<command\s+tool="([^"]+)">/);
        const commandStart = commandMatch ? commandMatch.index! : -1;
        const widgetStartTokenIdx = remaining.indexOf(WIDGET_START_TOKEN);
        const widgetTagStart = remaining.indexOf('<widget>');
        const sqlBlockStartMatch = remaining.match(/```sql\s/); 
        const sqlBlockStart = sqlBlockStartMatch ? sqlBlockStartMatch.index! : -1;

        // We need to find the *closest* one that is valid
        const indices = [
            { type: 'thought', index: thoughtStart },
            { type: 'command', index: commandStart },
            { type: 'widget_token', index: widgetStartTokenIdx },
            { type: 'widget_tag', index: widgetTagStart },
            { type: 'sql', index: sqlBlockStart }
        ].filter(x => x.index !== -1).sort((a, b) => a.index - b.index);

        if (indices.length === 0) {
            // No more tags, everything else is text
            if (remaining.length > 0) {
                 parts.push({ type: 'text', content: remaining });
            }
            break;
        }

        const nextTag = indices[0];
        
        // Push text before tag
        if (nextTag.index > 0) {
            parts.push({ type: 'text', content: remaining.slice(0, nextTag.index) });
        }

        // Advance cursor to tag start
        cursor += nextTag.index;
        const currentRemaining = content.slice(cursor);

        if (nextTag.type === 'thought') {
             const endTag = '</thought>';
             const endIdx = currentRemaining.indexOf(endTag);
             if (endIdx !== -1) {
                 thought = currentRemaining.slice('<thought>'.length, endIdx).trim();
                 cursor += endIdx + endTag.length;
             } else {
                 // Incomplete thought, consume rest but track it
                 thought = currentRemaining.slice('<thought>'.length).trim();
                 cursor = length; 
             }
        } else if (nextTag.type === 'command') {
            const match = currentRemaining.match(/^<command\s+tool="([^"]+)">/);
            if (match) {
                const tagLen = match[0].length;
                const endTag = '</command>';
                const endIdx = currentRemaining.indexOf(endTag);
                
                if (endIdx !== -1) {
                    const params = currentRemaining.slice(tagLen, endIdx).trim();
                    command = { tool: match[1], params };
                    cursor += endIdx + endTag.length;
                } else {
                    // Incomplete command - wait for more data
                    // We don't output it as text to avoid showing raw tags
                     cursor = length;
                }
            } else {
                cursor++; // Should not happen
            }
        } else if (nextTag.type === 'widget_token') {
             const startLen = WIDGET_START_TOKEN.length;
             const endIdx = currentRemaining.indexOf(WIDGET_END_TOKEN);
             if (endIdx !== -1) {
                 const json = currentRemaining.slice(startLen, endIdx).trim();
                 try {
                     // Handle markdown fences in JSON if present
                     let cleanJson = json;
                     if (cleanJson.startsWith('```')) {
                        cleanJson = cleanJson.replace(/^```[a-z]*\s*/i, '').replace(/```$/, '');
                     }
                     const config = JSON.parse(cleanJson) as WidgetConfig;
                     parts.push({ type: 'widget', config });
                 } catch (e) {
                     // Fallback to text if invalid JSON
                     parts.push({ type: 'text', content: currentRemaining.slice(0, endIdx + WIDGET_END_TOKEN.length) });
                 }
                 cursor += endIdx + WIDGET_END_TOKEN.length;
             } else {
                 // Incomplete widget
                 cursor = length;
             }
        } else if (nextTag.type === 'widget_tag') {
             const startLen = '<widget>'.length;
             const endIdx = currentRemaining.indexOf('</widget>');
             if (endIdx !== -1) {
                 const json = currentRemaining.slice(startLen, endIdx).trim();
                 try {
                     const config = JSON.parse(json) as WidgetConfig;
                     parts.push({ type: 'widget', config });
                 } catch (e) {
                      parts.push({ type: 'text', content: currentRemaining.slice(0, endIdx + '</widget>'.length) });
                 }
                 cursor += endIdx + '</widget>'.length;
             } else {
                 cursor = length;
             }
        } else if (nextTag.type === 'sql') {
             // ```sql code blocks -> promote to CodeExecutorWidget
             const match = currentRemaining.match(/^```sql\s*/);
             if (match) {
                 const startLen = match[0].length;
                 const endIdx = currentRemaining.indexOf('```', startLen);
                 
                 if (endIdx !== -1) {
                     const code = currentRemaining.slice(startLen, endIdx).trim();
                     
                     // Create a CodeExecutorWidget config
                     const config: WidgetConfig = {
                         type: 'code-executor',
                         id: `code-${Date.now()}-${parts.length}`, 
                         dataSource: 'databricks',
                         title: 'Generated SQL',
                         description: 'Review and execute this query',
                         language: 'sql',
                         code: code,
                         isEditable: true,
                         autoExecute: false,
                         gridWidth: 12
                     };
                     
                     parts.push({ type: 'widget', config });
                     cursor += endIdx + 3; // length of ```
                 } else {
                     // Incomplete block - treat as text so markdown renderer handles it for now
                     parts.push({ type: 'text', content: currentRemaining });
                     cursor = length;
                 }
             } else {
                 cursor++;
             }
        }
    }
    
    return { parts, thought, command };
}
