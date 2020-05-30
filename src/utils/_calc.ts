const gcd = (a: number, b: number): number => {
    return b ? gcd(b, a % b) : a
}

export const calcAspectRatio = ({ w, h }: { w: number; h: number }) => {
    const divisor = gcd(w, h)

    return [w / divisor, h / divisor] as const
}
