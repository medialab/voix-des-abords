import { useSpring, animated } from 'react-spring';

export function Group({
  children,
  style,
  onClick,
  className,
  onMouseEnter,
  onMouseLeave,
  ...props
}) {
  const animatedProps = useSpring(props);

  return (
    <animated.g {...animatedProps} className={className} onClick={onClick} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} style={style}>
      {children}
    </animated.g>
  )
}
export function ForeignObject({
  children,
  style,
  ...props
}) {
  const animatedProps = useSpring(props);

  return (
    <animated.foreignObject {...animatedProps} style={style}>
      {children}
    </animated.foreignObject>
  )
}

export function Text({
  children,
  style,
  onClick,
  ...props
}) {
  const animatedProps = useSpring(props);

  return (
    <animated.text {...animatedProps} onClick={onClick} style={style}>
      {children}
    </animated.text>
  )
}


export function Circle({
  children,
  style,
  onClick,
  className,
  onMouseEnter,
  onMouseLeave,
  ...props
}) {
  const animatedProps = useSpring(props);

  return (
    <animated.circle {...animatedProps} className={className} onClick={onClick} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} style={style}>
      {children}
    </animated.circle>
  )
}


export function Line({
  children,
  style,
  onClick,
  className,
  onMouseEnter,
  onMouseLeave,
  ...props
}) {
  const animatedProps = useSpring(props);

  return (
    <animated.line {...animatedProps} className={className} onClick={onClick} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} style={style}>
      {children}
    </animated.line>
  )
}

export function Path({
  onClick,
  className,
  ...props
}) {
  const mouseProps = Object.keys(props).filter(key => key.includes('Mouse'))
    .reduce((res, key) => ({ ...res, [key]: props[key] }), {});
  const animatedProps = useSpring(props);

  return (
    <animated.path className={className} onClick={onClick} {...animatedProps} {...mouseProps} />
  )
}

export function Rect({
  ...props
}) {
  const animatedProps = useSpring(props);

  return (
    <animated.rect {...animatedProps} />
  )
}