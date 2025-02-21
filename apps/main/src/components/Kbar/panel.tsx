import React, { useContext, useEffect, useState, useRef } from "react"
import { useRouter } from "next/router"
import { useDispatch, useSelector } from "~/hooks"
import { selectKbar } from "~/store/kbar/selectors"
import { kbarContext } from "./context"
import Tabs, { TabItemProps } from "../Tabs"
import HotkeyHelper from "../Helpers/hotkey"
import { Icon } from "@twilight-toolkit/ui"
import { deactivateKbar, updateKbar } from "~/store/kbar/actions"
import { useTheme } from "next-themes"
import ContentLoader from "react-content-loader"

const ListComponentLoading = ({ resolvedTheme }: { resolvedTheme: string }) => {
	if (resolvedTheme === "dark") {
		return <div data-cy="kbar-list-loading" className="h-full" />
	}

	return (
		<ContentLoader
			uniqueKey="kbar-loading-list-item"
			speed={2}
			width={100}
			style={{ width: "100%" }}
			height={44}
			backgroundColor="#f3f3f3"
			foregroundColor="#ecebeb"
		>
			<rect x="0" y="0" rx="5" ry="5" width="100%" height="44" />
		</ContentLoader>
	)
}

// Kbar list helper component
const ListComponent = ({
	tabsListItems,
	verticalListWrapper,
}: {
	tabsListItems: TabItemProps[]
	verticalListWrapper: React.MutableRefObject<HTMLDivElement>
}) => {
	const { resolvedTheme } = useTheme()
	const { loading } = useSelector(selectKbar)

	// update vertical list wrapper height
	// when the list is loading or no results found
	useEffect(() => {
		if (!verticalListWrapper.current) return
		let wrapperHeight = 0

		if (loading) {
			wrapperHeight = resolvedTheme === "dark" ? 360 : 66.39
		} else if (!tabsListItems) {
			wrapperHeight = 360
		} else if (tabsListItems.length === 0) {
			wrapperHeight = 66.39
		}

		if (wrapperHeight) {
			verticalListWrapper.current.style.height = `${wrapperHeight}px`
		}
	}, [loading, verticalListWrapper, tabsListItems])

	if (loading || tabsListItems == null) {
		return <ListComponentLoading resolvedTheme={resolvedTheme} />
	}

	if (tabsListItems.length === 0) {
		return (
			<div className="flex gap-x-3 text-gray-500 dark:text-gray-400 p-4">
				<span className="w-5 h-5">
					<Icon name="empty" />
				</span>
				<span>No results found</span>
			</div>
		)
	}

	return (
		<Tabs
			items={tabsListItems}
			direction="vertical"
			defaultHighlighted
			verticalListWrapper={verticalListWrapper}
		/>
	)
}

const KbarPanel = () => {
	const router = useRouter()
	const dispatch = useDispatch()
	const { resolvedTheme } = useTheme()
	const {
		inputValue,
		setInputValue,
		inputValueChangeHandler,
		setInputValueChangeHandler,
	} = useContext(kbarContext)
	const { list, placeholder, animation, location, loading } =
		useSelector(selectKbar)
	const verticalListWrapper = useRef<HTMLDivElement>(null)
	const [initialListItems, setiInitialListItems] = useState<TabItemProps[]>([])
	const [tabsListItems, setTabsListItems] = useState<TabItemProps[]>(null)

	// Update list data for vertical Tabs component
	useEffect(() => {
		// Decorate list item actions
		list?.forEach((item) => {
			// create action functions for link items
			let actionFunc = item.action

			// link
			if (item.link) {
				if (item.link.external) {
					actionFunc = () => {
						window.open(item.link.external, "_blank").focus()
					}
				} else if (item.link.internal) {
					actionFunc = () => {
						router.push(item.link.internal)
					}
				}
			}

			// sublist
			if (item.sublist) {
				actionFunc = () => {
					dispatch(
						updateKbar({
							key: item.sublist.key,
							location: [...location, item.sublist.key],
							items: item.sublist.list,
							placeholder: item.sublist.placeholder,
						})
					)
				}
			}

			item.action = () => {
				if (item.singleton !== false && !item.sublist) {
					dispatch(deactivateKbar())
				}

				if (item.link) {
					setTimeout(() => {
						actionFunc()
					}, 250)
				} else {
					actionFunc()
				}

				// clear input value
				setInputValue("")

				if (item.onInputChange) {
					setInputValueChangeHandler(() => item.onInputChange)
				} else {
					setInputValueChangeHandler(undefined)
				}
			}
		})

		const tabsListItems = list?.map((item) => {
			return {
				label: item.label,
				icon: item.icon,
				color: item.color,
				bgColor: item.bgColor,
				bgDark: item.bgDark,
				link: item.link,
				onClick: item.action,
				hoverable: item.hoverable,
				className: "w-full !justify-start !p-4",
				component:
					item.hoverable === false ? (
						<p className="kbar-list-heading text-sm text-gray-400">
							{item.label}
						</p>
					) : (
						<div className="flex justify-between w-full items-center">
							<div
								className={`flex gap-x-3 items-center w-4/5 ${
									item.color || ""
								}`}
							>
								{item.icon && (
									<span className="h-5 w-5 flex items-center">
										<Icon name={item.icon} />
									</span>
								)}
								<span>{item.label}</span>
							</div>
							<div className="flex gap-x-2.5 items-center">
								{item.description && (
									<div className="text-sm text-gray-400">
										{item.description}
									</div>
								)}
								{item.shortcut?.length && (
									<ul className="flex list-none gap-x-2 text-gray-500">
										<li className="capitalize bg-gray-100 dark:bg-transparent dark:border-gray-600 rounded-md border py-0.5 text-xs px-2">
											Shift
										</li>
										{item.shortcut.map((shortcut) => (
											<li
												key={shortcut}
												className="capitalize bg-gray-100 dark:bg-transparent dark:border-gray-600 rounded-md border py-0.5 text-xs px-2"
											>
												{shortcut}
											</li>
										))}
									</ul>
								)}
							</div>
						</div>
					),
			}
		})

		// update list data
		setiInitialListItems(tabsListItems)
		setTabsListItems(tabsListItems)
	}, [list, location])

	// Search list items
	useEffect(() => {
		if (
			!initialListItems ||
			!initialListItems.length ||
			!!inputValueChangeHandler
		) {
			return
		}

		const resultList = initialListItems.filter((item) => {
			// filter out unhoverable items when input value is not empty
			return (
				!inputValue ||
				(item.hoverable !== false &&
					item.label.toLowerCase().includes(inputValue.toLowerCase()))
			)
		})

		setTabsListItems(resultList)
	}, [inputValue, initialListItems])

	return (
		<div
			data-cy="kbar-panel"
			className="w-screen -ml-10 h-screen flex justify-center pointer-events-auto absolute"
		>
			{// register shortcuts of list items
			list?.map((item, index) => {
				if (item.shortcut?.length) {
					return <HotkeyHelper key={index} item={item} />
				}
			})}
			<div
				className={`z-50 ml-[16px] w-[620px] border dark:border-gray-700 rounded-xl shadow-2xl overflow-hidden backdrop-blur-lg bg-white/70 dark:bg-black/70 mt-[8%] h-fit max-h-[420px] ${
					animation === "transition"
						? "animate-kbarTransition"
						: animation === "out"
						  ? "animate-kbarOut"
						  : animation === "in"
						    ? "animate-kbar opacity-0"
						    : ""
				}`}
			>
				<div
					className={`h-[60px] border-b ${
						loading ? "dark:border-gray-800" : "dark:border-gray-700"
					} flex`}
				>
					<input
						data-cy="kbar-input"
						placeholder={placeholder}
						onChange={(e) => setInputValue(e.target.value)}
						value={inputValue}
						autoFocus
						className="flex-1 w-full bg-transparent rounded-tl-lg rounded-tr-lg text-lg py-4.5 px-5 outline-none text-gray-600 dark:text-gray-300"
					/>
					<div className="flex items-center mr-5">
						<ul className="flex list-none gap-x-2 text-gray-400 dark:text-gray-500">
							{location.map((key) => (
								<li
									key={key}
									onClick={() => {
										const newLocation = location.slice(
											0,
											location.indexOf(key) + 1
										)

										if (
											JSON.stringify(newLocation) === JSON.stringify(location)
										) {
											return
										}

										dispatch(
											updateKbar({
												key,
												location: newLocation,
											})
										)
										setInputValue("")
										setInputValueChangeHandler(undefined)
									}}
									className="cursor-pointer capitalize hover:bg-gray-100 dark:hover:bg-gray-800 dark:border-gray-600 border rounded-md py-1 text-xs px-2"
								>
									{key}
								</li>
							))}
						</ul>
					</div>
					{loading && resolvedTheme === "dark" && (
						<div className="animate-kbarLoadingBar kbar-loading-bar h-[1.5px] absolute bottom-[-1.25px] w-full z-50" />
					)}
				</div>
				<div
					data-cy="kbar-list"
					ref={verticalListWrapper}
					className={`px-2.5 py-2.5 overflow-hidden ${
						!loading && "overflow-y-auto"
					} max-h-[360px] kbar-mask kbar-list`}
				>
					<ListComponent
						tabsListItems={tabsListItems}
						verticalListWrapper={verticalListWrapper}
					/>
				</div>
			</div>
		</div>
	)
}

export default KbarPanel
