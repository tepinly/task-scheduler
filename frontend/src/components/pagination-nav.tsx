import {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from '@/components/ui/pagination'

interface PaginationNavProps {
	currentPage: number
	totalPages: number
	onPageChange: (page: number) => void
}

export function PaginationNav({
	currentPage,
	totalPages,
	onPageChange,
}: PaginationNavProps) {
	const handlePageChange = (page: number) => {
		if (page >= 1 && page <= totalPages) {
			onPageChange(page)
		}
	}

	const ellipsisElement = (index: number) => (
		<PaginationLink href="#" onClick={() => handlePageChange(index)}>
			<PaginationEllipsis />
		</PaginationLink>
	)

	const renderPageNumbers = () => {
		const pageNumbers = []
		const maxPagesToShow = 5
		const halfMaxPagesToShow = Math.floor(maxPagesToShow / 2)

		let startPage = Math.max(1, currentPage - halfMaxPagesToShow)
		let endPage = Math.min(totalPages, currentPage + halfMaxPagesToShow)

		if (currentPage <= halfMaxPagesToShow) {
			endPage = Math.min(totalPages, maxPagesToShow)
		}

		if (currentPage + halfMaxPagesToShow >= totalPages) {
			startPage = Math.max(1, totalPages - maxPagesToShow + 1)
		}

		for (let i = startPage; i <= endPage; i++) {
			pageNumbers.push(
				<PaginationItem key={i}>
					<PaginationLink
						href="#"
						isActive={i === currentPage}
						onClick={() => handlePageChange(i)}
					>
						{i}
					</PaginationLink>
				</PaginationItem>
			)
		}

		if (startPage > 1) {
			pageNumbers.unshift(
				<PaginationItem key="ellipsis-start">
					{ellipsisElement(1)}
				</PaginationItem>
			)
		}

		if (endPage < totalPages) {
			pageNumbers.push(
				<PaginationItem key="ellipsis-end">
					{ellipsisElement(totalPages)}
				</PaginationItem>
			)
		}

		return pageNumbers
	}

	return (
		<Pagination>
			<PaginationContent>
				<PaginationItem>
					<PaginationPrevious
						href="#"
						onClick={() => handlePageChange(currentPage - 1)}
					/>
				</PaginationItem>
				{renderPageNumbers()}
				<PaginationItem>
					<PaginationNext
						href="#"
						onClick={() => handlePageChange(currentPage + 1)}
					/>
				</PaginationItem>
			</PaginationContent>
		</Pagination>
	)
}
