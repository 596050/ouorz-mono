import { GetServerSideProps } from "next"
import Head from "next/head"
import TimeAgo from "react-timeago"
import redirect from "nextjs-redirect"
import { NextPageWithLayout } from "~/pages/_app"
import { contentLayout } from "~/components/Content"
import getApi from "~/utilities/api"
import SubscriptionBox from "~/components/SubscriptionBox"
import CommentBox from "~/components/CommentBox"
import PostContent from "~/components/PostContent"
import { useEffect } from "react"
import { useRouter } from "next/router"
import { useDispatch } from "~/hooks"
import { setHeaderTitle } from "~/store/general/actions"

const Redirect = redirect("/404")

interface Props {
	status: boolean
	page?: any
}

const BlogPage: NextPageWithLayout = ({ status, page }: Props) => {
	const router = useRouter()
	const dispatch = useDispatch()

	if (!status || !page) {
		return (
			<Redirect>
				<div className="text-center shadow-sm border rounded-md rounded-tl-none rounded-tr-none border-t-0 w-1/3 mx-auto bg-white py-3 animate-pulse">
					<h1 className="text-lg font-medium">404 Not Found</h1>
					<p className="text-gray-500 font-light tracking-wide text-sm">
						redirecting...
					</p>
				</div>
			</Redirect>
		)
	}

	const { pgid } = router.query
	const title = `${page.title.rendered} - Tony He`

	useEffect(() => {
		dispatch(setHeaderTitle(page.title.rendered))

		return () => {
			dispatch(setHeaderTitle(""))
		}
	}, [pgid])

	return (
		<div>
			<Head>
				<title>{title}</title>
				<link
					rel="icon"
					href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>📄</text></svg>"
				/>
				<meta name="description" content={page.title.rendered} />
			</Head>
			<article
				data-cy="pageContent"
				className="lg:shadow-sm lg:border lg:rounded-xl bg-white dark:bg-gray-800 dark:border-gray-800 p-5 lg:p-20 pt-24"
			>
				<div className="mb-20">
					<h1 className="text-1.5 lg:text-postTitle font-medium tracking-wider leading-snug">
						{page.title.rendered}
					</h1>
					<p className="flex text-5 lg:text-xl text-gray-500 dark:text-gray-400 space-x-2 mt-2 tracking-wide">
						<span>
							Posted <TimeAgo date={page.date} />
						</span>
						<span>·</span>
						<span>{page.post_metas.views} Views</span>
					</p>
				</div>
				<PostContent content={page.content.rendered} />
			</article>
			<div className="mt-5">
				<SubscriptionBox type="lg" />
			</div>
			<CommentBox />
		</div>
	)
}

export const getServerSideProps: GetServerSideProps = async (context) => {
	const pgid = context.params.pgid

	try {
		// Increase page views
		fetch(
			getApi({
				// @ts-ignore
				visit: pgid,
			})
		)

		// Fetch page data
		const resData = await fetch(
			getApi({
				// @ts-ignore
				page: pgid,
			})
		)

		if (!resData.ok) {
			return {
				props: {
					status: false,
				},
			}
		} else {
			const pageData = await resData.json()
			return {
				props: {
					status: true,
					page: pageData,
				},
			}
		}
	} catch (e) {
		console.error(e)
	}
}

BlogPage.layout = contentLayout

export default BlogPage
