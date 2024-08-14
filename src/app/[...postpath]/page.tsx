import React from "react";
import { headers } from 'next/headers';
import { GraphQLClient, gql } from "graphql-request";
import { notFound, redirect } from "next/navigation";

interface PostProps {
  post: any;
  host: string;
  path: string;
}

const fetchPostData = async (path: string) => {
  const endpoint = process.env.GRAPHQL_ENDPOINT as string;
  const graphQLClient = new GraphQLClient(endpoint);

  const query = gql`
    {
      post(id: "/${path}/", idType: URI) {
        id
        excerpt
        title
        link
        dateGmt
        modifiedGmt
        content
        author {
          node {
            name
          }
        }
        featuredImage {
          node {
            sourceUrl
            altText
          }
        }
      }
    }
  `;

  const data: any = await graphQLClient.request(query);
  return data.post;
};

const Post = async ({ params }: { params: { postpath: string[]; fbclid?: string } }) => {
  const headersList = headers();
  const referringURL = headersList.get('referer');
  const pathArr = params.postpath;
  const path = pathArr.join("/");
  const fbclid = params.fbclid;

  // Redirect if facebook is the referer or request contains fbclid
  if (referringURL?.includes("facebook.com") || fbclid) {
    const endpoint = process.env.GRAPHQL_ENDPOINT as string;
    redirect(`${endpoint.replace(/(\/graphql\/)/, "/") + encodeURI(path as string)}`);
  }

  const post = await fetchPostData(path);

  if (!post) {
    notFound();
  }

  const host = headersList.get('host');

  // Function to remove tags from excerpt
  const removeTags = (str: string) => {
    if (str === null || str === "") return "";
    else str = str.toString();
    return str.replace(/(<([^>]+)>)/gi, "").replace(/\[[^\]]*\]/, "");
  };

  return (
    <>
      <head>
        <meta property="og:title" content={post.title} />
        <link rel="canonical" href={`https://${host}/${path}`} />
        <meta property="og:description" content={removeTags(post.excerpt)} />
        <meta property="og:url" content={`https://${host}/${path}`} />
        <meta property="og:type" content="article" />
        <meta property="og:locale" content="en_US" />
        <meta property="og:site_name" content={host?.split(".")[0]} />
        <meta property="article:published_time" content={post.dateGmt} />
        <meta property="article:modified_time" content={post.modifiedGmt} />
        <meta property="og:image" content={post?.featuredImage?.node?.sourceUrl} />
        <meta
          property="og:image:alt"
          content={post?.featuredImage?.node?.altText || post.title}
        />
        <title>{post.title}</title>
      </head>
      <div className="post-container">
        <h1>{post.title}</h1>
        <img
          src={post?.featuredImage?.node?.sourceUrl}
          alt={post?.featuredImage?.node?.altText || post.title}
        />
        <article dangerouslySetInnerHTML={{ __html: post.content }} />
      </div>
    </>
  );
};

export default Post;
