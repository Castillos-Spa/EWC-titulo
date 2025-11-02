import { PaginationQueryDto } from '@/app/shared/dto/pagination-query.dto';

export function toPrismaPagination({ page = 1, pageSize = 20 }: PaginationQueryDto) {
  const safePageSize = Math.min(Math.max(pageSize, 1), 100);
  const safePage = Math.max(page, 1);

  return {
    skip: (safePage - 1) * safePageSize,
    take: safePageSize,
  };
}
