import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function NewsList() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [summary, setSummary] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const watchTimeRefs = useRef({});

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await axios.get("http://127.0.0.1:8000/news");
        const data = res.data.articles || [];

        if (data.length === 0) {
          setError("No results available or daily limit reached.");
        }

        setArticles(data);
      } catch (err) {
        console.error("Error fetching news:", err);
        setError("Failed to fetch news. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  // Track watch time when dialog opens
  useEffect(() => {
    if (isDialogOpen && selectedArticle) {
      const headline = selectedArticle.headline;
      const startTime = Date.now();
      watchTimeRefs.current[headline] = startTime;

      return () => {
        const endTime = Date.now();
        const watchTime = Math.round((endTime - startTime) / 1000); // in seconds
        if (watchTime > 0) {
          trackWatchTime(headline, watchTime);
        }
        delete watchTimeRefs.current[headline];
      };
    }
  }, [isDialogOpen, selectedArticle]);

  const trackWatchTime = async (headline, watchTime) => {
    try {
      await axios.post("http://127.0.0.1:8000/analytics/watch-time", {
        headline,
        category: selectedArticle.category,
        watch_time: watchTime,
      });
    } catch (err) {
      console.error("Error tracking watch time:", err);
    }
  };

  const trackRedditClick = async (article) => {
    try {
      await axios.post("http://127.0.0.1:8000/analytics/reddit-click", {
        headline,
        category: article.category, 
      });
    } catch (err) {
      console.error("Error tracking reddit click:", err);
    }
  };

  const handleReadMore = async (article) => {
    setSelectedArticle(article);
    setIsDialogOpen(true);
    setSummary("");
    setSummaryLoading(true);

    // Track "Read more" click
    try {
      await axios.post("http://127.0.0.1:8000/analytics/read-more-click", {
        headline: article.headline,
        category: article.category, 
      });
    } catch (err) {
      console.error("Error tracking read more click:", err);
    }

    // Fetch summary from backend
    try {
      const res = await axios.post("http://127.0.0.1:8000/news/summary", {
        headline: article.headline,
        news_link: article.news_link,
      });
      setSummary(res.data.summary || "Summary not available.");
    } catch (err) {
      console.error("Error fetching summary:", err);
      setSummary("Failed to generate summary. Please try again later.");
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleRedditClick = (article) => {
    trackRedditClick(article);
    window.open(article.reddit_link, "_blank");
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Fetching latest headlines...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-message text-center mt-10">
        <h2>⚠️ {error}</h2>
        <button onClick={() => window.location.reload()} className="retry-btn">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="news-container">
      
      <div className="news-grid">
        {articles.map((a, idx) => (
          <div key={idx} className="news-card">
            {a.image && (
              <img
                src={a.image}
                alt={a.headline}
                className="news-img"
                loading="lazy"
              />
            )}

            <h2>
              <a
                href={a.news_link || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="headline-link"
              >
                {a.headline}
              </a>
            </h2>

            <div className="discuss-reddit" style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <button
                onClick={() => handleReadMore(a)}
                className="discuss-button active"
                style={{ backgroundColor: "#4CAF50", color: "white" }}
              >
                Read more
              </button>
              {a.reddit_link ? (
                <button
                  onClick={() => handleRedditClick(a)}
                  className="discuss-button active"
                >
                  Discuss on Reddit
                </button>
              ) : (
                <button className="discuss-button disabled" disabled>
                  No Reddit Thread
                </button>
              )}
            </div>

          </div>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedArticle?.headline}</DialogTitle>
            <DialogDescription>
              {selectedArticle?.news_link && (
                <a
                  href={selectedArticle.news_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  Read full article →
                </a>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            {summaryLoading ? (
              <div className="text-center py-4">
                <div className="spinner"></div>
                <p>Generating summary...</p>
              </div>
            ) : (
              <div className="prose max-w-none">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {summary || "Loading summary..."}
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
