import { memo, useMemo, Fragment } from "react"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import useDrivePath from "@/hooks/useDrivePath"
import { useTranslation } from "react-i18next"
import useDriveParent from "@/hooks/useDriveParent"
import pathModule from "path"
import { Link } from "@tanstack/react-router"
import cacheMap from "@/lib/cacheMap"

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
				<BreadcrumbItem>
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

	const drivePathComponents = useMemo(() => {
		return ["/", ...drivePath.split("/").filter(Boolean)]
	}, [drivePath])

	return (
		<header className="flex shrink-0 items-center">
			<div
				className="overflow-hidden"
				data-dragselectallowed={true}
				style={{
					width: "calc(100dvw - var(--sidebar-width) - var(--sidebar-width-icon) + 16px)"
				}}
			>
				<div
					className="flex items-center gap-2 px-4 w-[calc(100dvw*100)] py-4"
					data-dragselectallowed={true}
				>
					<Breadcrumb>
						<BreadcrumbList>
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
			</div>
		</header>
	)
})

DriveHeader.displayName = "DriveHeader"

export default DriveHeader
