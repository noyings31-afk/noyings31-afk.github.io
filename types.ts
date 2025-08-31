export enum BlockType {
  SUBHEADING = 'subheading',
  PARAGRAPH = 'paragraph',
  IMAGE_PROMPT = 'image_prompt',
  IMAGE_DATA = 'image_data',
  KEY_MESSAGE_HEADING = 'key_message_heading',
  KEY_MESSAGE_ITEM = 'key_message_item',
}

export interface BlogBlock {
  type: BlockType;
  content: string;
}

export interface GeneratedBlogPost {
  title: string;
  blocks: BlogBlock[];
}
