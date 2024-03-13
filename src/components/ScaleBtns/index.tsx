import { ScaleButton, ScalesBtnContainer } from './styles';
import { AddFilled, Fullscreen, Minus } from '@vesoft-inc/icons';

interface ZoomBtnsProps {
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onFullScreen?: () => void;
}

function ZoomBtns(props: ZoomBtnsProps) {
  const { onZoomIn, onZoomOut, onFullScreen } = props;

  return (
    <ScalesBtnContainer>
      <ScaleButton variant="outlined" onMouseUp={onZoomOut}>
        <AddFilled fontSize="medium" />
      </ScaleButton>
      <ScaleButton variant="outlined" onMouseUp={onZoomIn}>
        <Minus fontSize="medium" />
      </ScaleButton>
      <ScaleButton variant="outlined" onClick={onFullScreen}>
        <Fullscreen fontSize="medium" />
      </ScaleButton>
    </ScalesBtnContainer>
  );
}
export default ZoomBtns;
