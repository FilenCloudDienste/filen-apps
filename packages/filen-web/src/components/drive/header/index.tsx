import { memo, useMemo, Fragment } from "react"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import useDrivePath from "@/hooks/useDrivePath"
import { useTranslation } from "react-i18next"
import useDriveParent from "@/hooks/useDriveParent"
import pathModule from "path"
import { Link } from "@tanstack/react-router"
import cacheMap from "@/lib/cacheMap"
import useElementDimensions from "@/hooks/useElementDimensions"

export const DriveHeaderBreadcrumb = memo(
	({ index, component, drivePathComponents }: { index: number; component: string; drivePathComponents: string[] }) => {
		const { t } = useTranslation()
		const driveParent = useDriveParent()

		const componentName = useMemo(() => {
			if (component === "/") {
				return t("cloudDrive")
			}

			return cacheMap.directoryUUIDToName.get(component) ?? component
		}, [component, t])

		return (
			<Fragment>
				{index > 0 && <BreadcrumbSeparator />}
				<BreadcrumbItem className="shrink-0">
					{(component === "/" && drivePathComponents.length === 1) || driveParent?.uuid === component ? (
						<BreadcrumbPage>{componentName}</BreadcrumbPage>
					) : (
						<BreadcrumbLink asChild={true}>
							<Link to={pathModule.posix.join("/", "drive", ...drivePathComponents.slice(1, index + 1))}>
								{componentName}
							</Link>
						</BreadcrumbLink>
					)}
				</BreadcrumbItem>
			</Fragment>
		)
	}
)

DriveHeaderBreadcrumb.displayName = "DriveHeaderBreadcrumb"

export const DriveHeader = memo(() => {
	const drivePath = useDrivePath()
	const [ref, { width }] = useElementDimensions<HTMLDivElement>()

	const drivePathComponents = useMemo(() => {
		return ["/", ...drivePath.split("/").filter(Boolean)]
	}, [drivePath])

	return (
		<header
			className="flex shrink-0 items-center w-full h-auto"
			data-dragselectallowed={true}
		>
			<div
				ref={ref}
				className="flex items-center gap-2 px-4 py-4 flex-row w-full h-auto"
				data-dragselectallowed={true}
			>
				<Breadcrumb data-dragselectallowed={true}>
					<BreadcrumbList
						className="overflow-hidden flex-nowrap flex flex-row flex-1"
						style={{
							width: width - 32
						}}
						data-dragselectallowed={true}
					>
						{drivePathComponents.map((component, index) => (
							<DriveHeaderBreadcrumb
								key={index}
								index={index}
								component={component}
								drivePathComponents={drivePathComponents}
							/>
						))}
					</BreadcrumbList>
				</Breadcrumb>
			</div>
		</header>
	)
})

DriveHeader.displayName = "DriveHeader"

export default DriveHeader
