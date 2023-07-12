import Header from "~/components/Header"
import Footer from "../Footer"
import React, { PropsWithChildren } from "react"

interface Props extends PropsWithChildren<{}> {}

const Content = (props: Props) => {
	const { children } = props
	return (
		<div>
			<Header />
			<main className="w-full min-h-main lg:w-page h-auto mx-auto pt-0 lg:pt-24">
				<>{children}</>
			</main>
			<Footer />
		</div>
	)
}

export const contentLayout = (page: React.ReactElement) => {
	return <Content>{page}</Content>
}

export default Content
