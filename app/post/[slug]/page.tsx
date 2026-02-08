// app/post/[slug]/page.tsx - SEO-Friendly Direct Page
import { Metadata } from 'next';
import { getPostBySlug } from '@/lib/api';
import { notFound } from 'next/navigation';
import Link from 'next/link';

// Server-side Data Fetching
async function getPost(slug: string) {
  const post = await getPostBySlug(slug);
  if (!post) return null;
  return post;
}

// SEO Metadata (Critical for Search Engines)
export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ slug: string }> 
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  
  if (!post) {
    return {
      title: 'Post Not Found',
    };
  }
  
  return { 
    title: post.title,
    description: post.shortDesc,
    openGraph: {
      title: post.title,
      description: post.shortDesc,
      images: [post.thumbnail],
    },
  };
}

// The SEO Page (Server Component)
export default async function PostPage({ 
  params 
}: { 
  params: Promise<{ slug: string }> 
}) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-4xl mx-auto py-10 px-4">
        {/* Back Button */}
        <Link 
          href="/"
          className="inline-flex items-center gap-2 text-black hover:text-black mb-6 group"
        >
          <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Feed
        </Link>

        {/* Content */}
        <article className="bg-white rounded-xl shadow-lg p-8">
          <div className="mb-6">
            <span className="inline-block px-3 py-1 bg-blue-100 text-black text-xs font-semibold rounded-full mb-4">
              📄 SEO-Friendly Server Page
            </span>
            <h1 className="text-5xl font-bold mb-4 text-black leading-tight">
              {post.title}
            </h1>
            <div className="flex items-center gap-4 text-sm text-black">
              {post.author && <span className="font-medium">By {post.author}</span>}
              {post.publishedAt && (
                <span>
                  {new Date(post.publishedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              )}
            </div>
          </div>

          <img 
            src={post.thumbnail} 
            alt={post.title}
            className="w-full h-96 object-cover rounded-lg mb-8 shadow-md" 
          />

          <div className="text-black text-xl leading-relaxed mb-8">
            {post.shortDesc}
          </div>

          {post.content && (
            <div 
              className="prose prose-lg max-w-none prose-headings:text-black prose-p:text-black prose-li:text-black"
              dangerouslySetInnerHTML={{ __html: post.content }} 
            />
          )}

          {/* Related Posts */}
          {post.relatedPosts && post.relatedPosts.length > 0 && (
            <div className="mt-12 border-t pt-8">
              <h3 className="font-bold text-2xl mb-6 text-black">Related Posts</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {post.relatedPosts.map((related) => (
                  <Link
                    key={related.id}
                    href={`/post/${related.slug}`}
                    className="group block border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    <img 
                      src={related.thumbnail} 
                      className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
                      alt={related.title}
                    />
                    <div className="p-3">
                      <h4 className="font-semibold text-sm line-clamp-2 group-hover:text-black">
                        {related.title}
                      </h4>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </article>
      </div>
    </div>
  );
}
