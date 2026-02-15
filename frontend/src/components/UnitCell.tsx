export const UnitCellLabel = ({ label }: { label: string }) => {
  return (
    <div
      css={{
        fontSize: "15px",
        fontWeight: "bold",
      }}
    >
      {label}
    </div>
  );
};

export const UnitCell = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => {
  return (
    <div className="flex-vc gap-0.5">
      <div className="flex-c" css={{ height: "60px" }}>
        {children}
      </div>
      <UnitCellLabel label={label} />
    </div>
  );
};
