type CloseDetail = () => void;

type PointerCloseContext = {
  clickedDateCell: boolean;
  clickedInsidePanel: boolean;
};

export function closeDetailFromButton(closeDetail: CloseDetail) {
  closeDetail();
}

export function closeDetailFromPointer(
  closeDetail: CloseDetail,
  { clickedDateCell, clickedInsidePanel }: PointerCloseContext,
) {
  if (clickedDateCell || clickedInsidePanel) return false;
  closeDetail();
  return true;
}

export function closeDetailFromKey(closeDetail: CloseDetail, key: string) {
  if (key !== "Escape") return false;
  closeDetail();
  return true;
}
