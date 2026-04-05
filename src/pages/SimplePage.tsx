export function SimplePage({
  title,
  description,
}: {
  title: string
  description?: string
}) {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-[hsl(var(--foreground))]">
        {title}
      </h1>
      {description ? (
        <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
          {description}
        </p>
      ) : null}
    </div>
  )
}

