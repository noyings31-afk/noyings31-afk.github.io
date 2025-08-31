import React, { useState, useCallback } from 'react';
import { generateBlogPostStructure, generateImageFromPrompt } from './services/geminiService';
import { GeneratedBlogPost, BlogBlock, BlockType } from './types';

// --- SVG Icons (defined outside component to prevent re-creation) ---
const MagicWandIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
    <path d="M17.293 2.293a1 1 0 00-1.414 0l-1.06 1.06a1 1 0 000 1.414l5.656 5.657a1 1 0 001.414 0l1.06-1.06a1 1 0 000-1.414L17.293 2.293zM3.293 17.293a1 1 0 011.414 0l1.06 1.06a1 1 0 010 1.414l-5.656 5.657a1 1 0 01-1.414 0l-1.06-1.06a1 1 0 010-1.414L3.293 17.293z" opacity=".4" />
    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.172l3.243 3.242a1 1 0 11-1.414 1.415L11 7.414V17a1 1 0 11-2 0V7.414l-2.828 2.829a1 1 0 01-1.415-1.415L8 4.172V3a1 1 0 011-1z" clipRule="evenodd" />
  </svg>
);

const LoadingSpinner = () => (
  <div className="flex justify-center items-center">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
  </div>
);

// --- UI Components (defined outside App to prevent re-rendering issues) ---

const InitialScreen: React.FC = () => (
  <div className="text-center p-8 bg-white border border-gray-200 rounded-lg shadow-md animate-fade-in">
    <h2 className="text-2xl font-bold text-indigo-600 mb-4">AI 블로그 글 생성기</h2>
    <div className="text-gray-600 space-y-3">
        <p>"주제: [원하는 블로그 글 주제]" 와 같이 입력해주세요.</p>
        <p>해당 주제에 맞춰 짐 에드워즈의 카피라이팅 원칙을 적용하여 블로그 글을 작성하고, 내용에 어울리는 이미지를 추가합니다.</p>
        <p className="text-sm text-gray-500">글의 길이는 약 4000자 내외로 생성됩니다.</p>
        <p className="font-semibold mt-4">예시: "주제: 챗GPT를 활용한 마케팅 자동화 전략"</p>
    </div>
  </div>
);

interface TopicFormProps {
  onSubmit: (topic: string) => void;
  isLoading: boolean;
}

const TopicForm: React.FC<TopicFormProps> = ({ onSubmit, isLoading }) => {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      // Extract topic from "주제: [topic]" format
      const match = inputValue.match(/주제:\s*(.*)/);
      const topic = match ? match[1].trim() : inputValue.trim();
      onSubmit(topic);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mt-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
      <div className="flex items-center bg-white border border-gray-300 rounded-full shadow-lg p-1.5">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="여기에 블로그 주제를 입력하세요..."
          className="w-full bg-transparent text-gray-900 placeholder-gray-400 focus:outline-none px-4"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading}
          className="flex items-center justify-center bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-full transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-indigo-300"
        >
          {isLoading ? '생성 중...' : <><MagicWandIcon /> 생성</>}
        </button>
      </div>
    </form>
  );
};

interface BlogPostDisplayProps {
  post: GeneratedBlogPost;
  onReset: () => void;
}

const BlogPostDisplay: React.FC<BlogPostDisplayProps> = ({ post, onReset }) => (
  <div className="w-full max-w-4xl mx-auto bg-white border border-gray-200 rounded-lg shadow-xl p-6 sm:p-10 my-10 animate-fade-in">
    <article className="prose prose-lg max-w-none prose-h1:text-gray-900 prose-h2:text-gray-800 prose-p:text-gray-700 prose-strong:text-gray-900 prose-li:text-gray-700">
      <h1>{post.title}</h1>
      {post.blocks.map((block, index) => {
        switch (block.type) {
          case BlockType.SUBHEADING:
            return <h2 key={index}>{block.content}</h2>;
          case BlockType.PARAGRAPH:
            return <p key={index}>{block.content}</p>;
          case BlockType.IMAGE_DATA:
            return <img key={index} src={block.content} alt={`Generated image ${index + 1}`} className="rounded-lg shadow-md my-8" />;
          case BlockType.KEY_MESSAGE_HEADING:
            return <h3 key={index} className="text-xl font-bold text-indigo-600 mt-8 border-t border-gray-200 pt-6">{block.content}</h3>;
          case BlockType.KEY_MESSAGE_ITEM:
            return <li key={index} className="ml-5">{block.content}</li>;
          default:
            return null;
        }
      })}
    </article>
    <div className="text-center mt-12">
        <button 
            onClick={onReset}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-8 rounded-full transition-colors duration-300"
        >
            새로운 글 생성하기
        </button>
    </div>
  </div>
);


// --- Main App Component ---
function App() {
  const [topic, setTopic] = useState<string>('');
  const [blogPost, setBlogPost] = useState<GeneratedBlogPost | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleReset = () => {
    setTopic('');
    setBlogPost(null);
    setError(null);
    setIsLoading(false);
  };

  const handleSubmit = useCallback(async (submittedTopic: string) => {
    if (!submittedTopic) return;
    handleReset();
    setTopic(submittedTopic);
    setIsLoading(true);
    setError(null);

    try {
      setLoadingMessage('1/2: 블로그 초안을 작성하고 있습니다...');
      const structuredPost = await generateBlogPostStructure(submittedTopic);

      setLoadingMessage('2/2: 내용에 맞는 이미지를 생성하고 있습니다...');
      const imagePrompts = structuredPost.blocks.filter(block => block.type === BlockType.IMAGE_PROMPT);
      
      const imageGenerationPromises = imagePrompts.map(block => generateImageFromPrompt(block.content));
      const generatedImages = await Promise.all(imageGenerationPromises);
      
      let imageIndex = 0;
      const finalBlocks = structuredPost.blocks.map(block => {
          if (block.type === BlockType.IMAGE_PROMPT) {
              return {
                  type: BlockType.IMAGE_DATA,
                  content: generatedImages[imageIndex++],
              };
          }
          return block;
      });

      setBlogPost({ ...structuredPost, blocks: finalBlocks });

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 flex flex-col items-center p-4 sm:p-8 font-sans">
      <header className="w-full max-w-4xl text-center mb-8 animate-slide-up">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-blue-600 py-2">
          AI SEO 블로그 생성기
        </h1>
      </header>

      <main className="w-full flex-grow flex flex-col items-center justify-center">
        {isLoading && (
            <div className="text-center p-8 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg animate-fade-in">
                <LoadingSpinner />
                <p className="mt-4 text-lg text-indigo-600">{loadingMessage}</p>
                <p className="mt-2 text-gray-600">잠시만 기다려주세요. 최고의 콘텐츠를 만들고 있습니다.</p>
            </div>
        )}

        {error && !isLoading && (
            <div className="text-center p-8 bg-red-50 border border-red-300 rounded-lg animate-fade-in">
                <h3 className="text-xl font-bold text-red-700">오류가 발생했습니다</h3>
                <p className="mt-2 text-red-600">{error}</p>
                <button 
                  onClick={handleReset}
                  className="mt-4 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-full transition-colors"
                >
                  다시 시도
                </button>
            </div>
        )}
        
        {!isLoading && !blogPost && !error && (
            <>
                <InitialScreen />
                <TopicForm onSubmit={handleSubmit} isLoading={isLoading} />
            </>
        )}

        {blogPost && !isLoading && (
          <BlogPostDisplay post={blogPost} onReset={handleReset} />
        )}
      </main>
      
      <div className="fixed bottom-4 right-4 text-xs text-gray-400 bg-white/50 backdrop-blur-sm px-2 py-1 rounded">
        Created by ove9
      </div>

      <footer className="text-center text-gray-400 text-sm py-4 mt-8">
        <p>Powered by Google Gemini API</p>
      </footer>
    </div>
  );
}

export default App;