import { diffLines } from "diff";

const DiffChars = ({ one, another }) => {
  const diff = diffLines(one, another, { newlineIsToken: true });

  return (
    <div>
      {diff.map((part) => {
        const { added, removed, value } = part;
        return (
          <span
            style={{
              color: added ? "green" : removed ? "red" : "grey",
              width: "100%"
            }}
          >
            {value}
          </span>
        );
      })}
    </div>
  );
};

export default DiffChars;
