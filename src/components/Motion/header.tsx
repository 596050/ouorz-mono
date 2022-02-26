import React from 'react'
import { useTheme } from 'next-themes'
import ScrollWrapper from './scroll'

interface Props {
	componentRef: React.MutableRefObject<HTMLDivElement>
	children: React.ReactNode
}

const BoxShadowTransition = (props: Props) => {
	const { componentRef: ref, children } = props
	const { theme } = useTheme()

	const handler = (position: number) => {
		if (!ref?.current) return

		ref.current.style.background = `rgba(${
			theme === 'dark' ? '38, 38, 38' : '255, 255, 255'
		}, ${position * 0.02})`
		ref.current.style.boxShadow = `0px 1px 3px rgba(0,0,0,${
			position * (2 / 1000)
		})`
	}

	return (
		<ScrollWrapper handler={handler} endPosition={50}>
			{children}
		</ScrollWrapper>
	)
}

export default BoxShadowTransition
