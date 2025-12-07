import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, ThumbsUp, ThumbsDown, CheckCircle } from '@untitledui/icons';
import { CSSAnimatedList } from '../CSSAnimatedList';
import { CSSAnimatedItem } from '../CSSAnimatedItem';
import { CategoryIcon } from '../category-icons';
import { submitArticleFeedback } from '../api';
import { getSessionId } from '../utils';
import DOMPurify from 'isomorphic-dompurify';
import type { WidgetConfig } from '../api';

interface HelpArticle {
  id: string;
  title: string;
  content: string;
  category_id?: string;
  category?: string;
  featured_image?: string;
}

interface HelpCategory {
  id: string;
  name: string;
  icon?: string;
}

interface HelpViewProps {
  config: WidgetConfig;
  helpCategories: HelpCategory[];
  helpArticles: HelpArticle[];
}

export const HelpView = ({
  config,
  helpCategories,
  helpArticles,
}: HelpViewProps) => {
  const [helpSearchQuery, setHelpSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null);
  const [articleFeedback, setArticleFeedback] = useState<'helpful' | 'not_helpful' | null>(null);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [showFeedbackComment, setShowFeedbackComment] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const filteredArticles = helpArticles.filter(article => {
    const matchesSearch = !helpSearchQuery || article.title.toLowerCase().includes(helpSearchQuery.toLowerCase()) || article.content.toLowerCase().includes(helpSearchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || article.category_id === selectedCategory || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSubmitFeedback = async () => {
    if (!selectedArticle || articleFeedback === null) return;
    try {
      const sessionId = getSessionId();
      await submitArticleFeedback(selectedArticle.id, { sessionId, isHelpful: articleFeedback === 'helpful', comment: feedbackComment });
      setFeedbackSubmitted(true);
    } catch (error: any) {
      console.error('Error submitting feedback:', error);
    }
  };

  const resetArticleState = () => {
    setSelectedArticle(null);
    setArticleFeedback(null);
    setShowFeedbackComment(false);
    setFeedbackComment('');
    setFeedbackSubmitted(false);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden widget-view-enter">
      {/* Level 1: Categories List / Search Results (No category selected) */}
      {!selectedCategory && !selectedArticle && (
        <>
          <div className="p-4 border-b bg-muted/50">
            {helpSearchQuery ? (
              <div className="flex items-center gap-2 mb-3">
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => setHelpSearchQuery('')}
                  className="h-8"
                >
                  <ChevronRight className="h-4 w-4 rotate-180" />
                </Button>
                <h3 className="text-lg font-semibold">Search Results</h3>
              </div>
            ) : (
              <h3 className="text-lg font-semibold mb-3">Help Center</h3>
            )}
            <Input
              value={helpSearchQuery}
              onChange={(e) => setHelpSearchQuery(e.target.value)}
              placeholder="Search help articles..."
              className="h-9 placeholder:text-xs"
            />
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {helpSearchQuery ? (
              // Search Results
              filteredArticles.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-8 widget-animated-item">
                  No articles found
                </p>
              ) : (
                <CSSAnimatedList className="space-y-2" staggerDelay={0.1}>
                  {filteredArticles.map((article) => (
                    <CSSAnimatedItem key={article.id}>
                      <div
                        className="p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                        onClick={() => {
                          setSelectedArticle(article);
                          setHelpSearchQuery('');
                        }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-medium text-sm flex-1">{article.title}</h4>
                          {article.category && (
                            <Badge variant="secondary" className="text-xs flex-shrink-0">
                              {article.category}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CSSAnimatedItem>
                  ))}
                </CSSAnimatedList>
              )
            ) : (
              // Categories List
              helpCategories.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-8 widget-animated-item">
                  No categories available
                </p>
              ) : (
                <CSSAnimatedList className="space-y-3" staggerDelay={0.1}>
                  {helpCategories.map((category) => {
                    const articlesInCategory = helpArticles.filter(
                      a => a.category_id === category.id || a.category === category.name
                    ).length;
                    
                    return (
                      <CSSAnimatedItem key={category.id}>
                        <button
                          className="w-full p-4 border rounded-lg bg-card hover:bg-accent/50 cursor-pointer transition-all text-left active:scale-[0.98]"
                          onClick={() => setSelectedCategory(category.id)}
                        >
                          <div className="flex items-center gap-3">
                            <div 
                              className="p-2.5 rounded-lg flex-shrink-0"
                              style={{ backgroundColor: `${config.gradientStartColor}15` }}
                            >
                              <CategoryIcon 
                                name={category.icon} 
                                className="h-5 w-5" 
                                style={{ color: config.gradientStartColor }}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm">{category.name}</h4>
                              <p className="text-xs text-muted-foreground mt-1">
                                {articlesInCategory} {articlesInCategory === 1 ? 'article' : 'articles'}
                              </p>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                          </div>
                        </button>
                      </CSSAnimatedItem>
                    );
                  })}
                </CSSAnimatedList>
              )
            )}
          </div>
        </>
      )}

      {/* Level 2: Articles in Category (Category selected, no article) */}
      {selectedCategory && !selectedArticle && (
        <>
          <div className="p-4 border-b bg-muted/50">
            <div className="flex items-center gap-2 mb-3">
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => {
                  setSelectedCategory(null);
                  setHelpSearchQuery('');
                }}
                className="h-8"
              >
                <ChevronRight className="h-4 w-4 rotate-180" />
              </Button>
              <h3 className="text-lg font-semibold">
                {helpCategories.find(c => c.id === selectedCategory)?.name || 'Articles'}
              </h3>
            </div>
            <Input
              value={helpSearchQuery}
              onChange={(e) => setHelpSearchQuery(e.target.value)}
              placeholder="Search in this category..."
              className="h-9 placeholder:text-xs"
            />
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {filteredArticles.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-8 widget-animated-item">
                No articles in this category
              </p>
            ) : (
              <CSSAnimatedList className="space-y-2" staggerDelay={0.1}>
                {filteredArticles.map((article) => (
                  <CSSAnimatedItem key={article.id}>
                    <button
                      className="w-full p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors text-left active:scale-[0.98]"
                      onClick={() => setSelectedArticle(article)}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-medium text-sm flex-1">{article.title}</h4>
                        <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      </div>
                    </button>
                  </CSSAnimatedItem>
                ))}
              </CSSAnimatedList>
            )}
          </div>
        </>
      )}

      {/* Level 3: Article Content with Feedback */}
      {selectedArticle && (
        <div className="flex-1 flex flex-col overflow-hidden widget-content-enter">
          {/* Scrollable Article Content */}
          <div className="flex-1 overflow-y-auto">
            {/* Hero Section - Only shown if featured_image exists */}
            {selectedArticle.featured_image ? (
              <>
                <div 
                  className="relative h-48 bg-cover bg-center"
                  style={{ backgroundImage: `url(${selectedArticle.featured_image})` }}
                >
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
                  
                  {/* Back Button - Top Left */}
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={resetArticleState}
                    className="absolute top-3 left-3 text-white hover:bg-white/20 hover:text-white"
                  >
                    <ChevronRight className="h-4 w-4 rotate-180 mr-1" />
                    Back
                  </Button>
                  
                  {/* Title - Bottom */}
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h2 className="text-xl font-bold text-white drop-shadow-lg">{selectedArticle.title}</h2>
                  </div>
                </div>
                
                {/* Article Content below hero */}
                <div className="p-4">
                  <div 
                    className="article-content max-w-none" 
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedArticle.content, {
                      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'b', 'i', 'u', 'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre', 'span', 'div', 'img'],
                      ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'src', 'alt', 'width', 'height', 'style'],
                    }) }} 
                  />
                </div>
              </>
            ) : (
              /* Standard layout for articles without featured image */
              <div className="p-4">
                {/* Back button and title */}
                <div className="flex items-center gap-2 mb-4">
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={resetArticleState}
                    className="h-8"
                  >
                    <ChevronRight className="h-4 w-4 rotate-180" />
                  </Button>
                  <h2 className="text-lg font-semibold">{selectedArticle.title}</h2>
                </div>
                
                {/* Article content */}
                <div 
                  className="article-content max-w-none" 
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedArticle.content, {
                    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'b', 'i', 'u', 'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre', 'span', 'div', 'img'],
                    ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'src', 'alt', 'width', 'height', 'style'],
                  }) }} 
                />
              </div>
            )}
            
            {/* Feedback Section - always at bottom of content */}
            <div className="p-4 border-t bg-muted/30">
              {feedbackSubmitted ? (
                <div className="text-center py-4">
                  <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-sm font-medium">Thanks for your feedback!</p>
                  <p className="text-xs text-muted-foreground mt-1">Your input helps us improve.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-center">Was this article helpful?</p>
                  <div className="flex justify-center gap-3">
                    <Button
                      size="sm"
                      variant={articleFeedback === 'helpful' ? 'default' : 'outline'}
                      onClick={() => {
                        setArticleFeedback('helpful');
                        setShowFeedbackComment(true);
                      }}
                      className="gap-1.5"
                      style={articleFeedback === 'helpful' ? { backgroundColor: config.primaryColor } : undefined}
                    >
                      <ThumbsUp className="h-4 w-4" />
                      Yes
                    </Button>
                    <Button
                      size="sm"
                      variant={articleFeedback === 'not_helpful' ? 'default' : 'outline'}
                      onClick={() => {
                        setArticleFeedback('not_helpful');
                        setShowFeedbackComment(true);
                      }}
                      className="gap-1.5"
                      style={articleFeedback === 'not_helpful' ? { backgroundColor: config.primaryColor } : undefined}
                    >
                      <ThumbsDown className="h-4 w-4" />
                      No
                    </Button>
                  </div>
                  
                  {showFeedbackComment && (
                    <div className="space-y-2 mt-3">
                      <Textarea
                        value={feedbackComment}
                        onChange={(e) => setFeedbackComment(e.target.value)}
                        placeholder={articleFeedback === 'helpful' ? "What did you find most helpful? (optional)" : "How can we improve this article? (optional)"}
                        className="text-sm resize-none"
                        rows={3}
                      />
                      <Button
                        size="sm"
                        onClick={handleSubmitFeedback}
                        className="w-full"
                        style={{ backgroundColor: config.primaryColor }}
                      >
                        Submit Feedback
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
