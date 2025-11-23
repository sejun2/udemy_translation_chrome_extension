/**
 * Utility class to merge fragmented sentences from transcript cues
 * Handles cases where a single sentence is split across multiple caption containers
 */
export class SentenceMerger {
  /**
   * Check if text ends with incomplete sentence
   * @param text Text to check
   * @returns true if text appears to be incomplete
   */
  private static isIncompleteText(text: string): boolean {
    const trimmed = text.trim();
    if (!trimmed) return false;

    // Check if ends with sentence terminators
    const sentenceEnders = ['.', '!', '?', '。', '！', '？'];
    const lastChar = trimmed[trimmed.length - 1];

    if (sentenceEnders.includes(lastChar)) {
      return false;
    }

    // Check for common incomplete patterns
    const incompletePatterns = [
      /\band$/i,           // "Tom and"
      /\bor$/i,            // "this or"
      /\bthe$/i,           // "with the"
      /\ba$/i,             // "is a"
      /\ban$/i,            // "is an"
      /,$/,                // ends with comma
      /\bto$/i,            // "want to"
      /\bof$/i,            // "part of"
      /\bin$/i,            // "live in"
      /\bat$/i,            // "look at"
      /\bfor$/i,           // "wait for"
      /\bwith$/i,          // "work with"
      /\bthat$/i,          // "know that"
      /\bwhich$/i,         // "the one which"
      /\bwho$/i,           // "person who"
    ];

    return incompletePatterns.some(pattern => pattern.test(trimmed));
  }

  /**
   * Check if text starts with lowercase (indicates continuation)
   * @param text Text to check
   * @returns true if starts with lowercase
   */
  private static startsWithLowercase(text: string): boolean {
    const trimmed = text.trim();
    if (!trimmed) return false;

    const firstChar = trimmed[0];
    return firstChar === firstChar.toLowerCase() && /[a-z]/.test(firstChar);
  }

  /**
   * Merge an array of potentially fragmented text segments
   * @param segments Array of text segments from consecutive cues
   * @returns Merged segments grouped by complete sentences
   */
  static mergeFragments(segments: string[]): string[][] {
    if (segments.length === 0) return [];
    if (segments.length === 1) return [[segments[0]]];

    const merged: string[][] = [];
    let currentGroup: string[] = [segments[0]];

    for (let i = 1; i < segments.length; i++) {
      const current = segments[i];
      const previous = segments[i - 1];

      // Check if current segment is a continuation of previous
      const isContinuation =
        this.isIncompleteText(previous) ||
        this.startsWithLowercase(current);

      if (isContinuation) {
        // Merge with current group
        currentGroup.push(current);
      } else {
        // Start new group
        merged.push(currentGroup);
        currentGroup = [current];
      }
    }

    // Don't forget the last group
    if (currentGroup.length > 0) {
      merged.push(currentGroup);
    }

    return merged;
  }

  /**
   * Join text segments with proper spacing
   * @param segments Array of text segments
   * @returns Joined text
   */
  static joinSegments(segments: string[]): string {
    return segments.map(s => s.trim()).join(' ').trim();
  }

  /**
   * Extract text from transcript cue elements
   * @param cueElements Array of cue elements
   * @returns Array of text segments
   */
  static extractTextsFromCues(cueElements: Element[]): string[] {
    return cueElements.map(cue => {
      const cueTextElement = cue.querySelector('[data-purpose="cue-text"]') || cue;
      return cueTextElement.textContent?.trim() || '';
    }).filter(text => text.length > 0);
  }

  /**
   * Process transcript cues and group them by complete sentences
   * @param cueElements Array of transcript cue elements
   * @returns Array of grouped cues with merged text
   */
  static groupCuesBySentence(cueElements: Element[]): { cues: Element[], text: string }[] {
    const texts = this.extractTextsFromCues(cueElements);
    const mergedGroups = this.mergeFragments(texts);

    const result: { cues: Element[], text: string }[] = [];
    let cueIndex = 0;

    for (const group of mergedGroups) {
      const groupCues = cueElements.slice(cueIndex, cueIndex + group.length);
      const mergedText = this.joinSegments(group);

      result.push({
        cues: groupCues,
        text: mergedText
      });

      cueIndex += group.length;
    }

    return result;
  }
}
