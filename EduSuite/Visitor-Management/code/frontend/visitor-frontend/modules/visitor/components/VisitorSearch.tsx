"use client";

import {
  FormEvent,
  useState,
} from "react";

interface VisitorSearchProps {
  value?: string;
  onSearch: (search: string) => void;
  placeholder?: string;
}

export default function VisitorSearch({
  value = "",
  onSearch,
  placeholder = "Search visitors...",
}: VisitorSearchProps) {
  const [search, setSearch] =
    useState(value);

  function submit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    onSearch(search.trim());
  }

  function clear() {
    setSearch("");
    onSearch("");
  }

  return (
    <form
      onSubmit={submit}
      style={formStyle}
      role="search"
    >
      <input
        type="search"
        value={search}
        onChange={(event) =>
          setSearch(event.target.value)
        }
        placeholder={placeholder}
        aria-label="Search visitors"
        style={inputStyle}
      />

      <button
        type="submit"
        style={searchButtonStyle}
      >
        Search
      </button>

      {search.length > 0 && (
        <button
          type="button"
          onClick={clear}
          style={clearButtonStyle}
        >
          Clear
        </button>
      )}
    </form>
  );
}

const formStyle = {
  display: "flex",
  flexWrap: "wrap" as const,
  gap: 10,
};

const inputStyle = {
  flex: 1,
  minWidth: 220,
  height: 44,
  padding: "0 14px",
  border: "1px solid #d8e0eb",
  borderRadius: 9,
  background: "#ffffff",
  color: "#071f4e",
  outline: "none",
};

const searchButtonStyle = {
  padding: "0 18px",
  height: 44,
  border: "none",
  borderRadius: 9,
  background: "#0b2859",
  color: "#ffffff",
  cursor: "pointer",
  fontWeight: 700,
};

const clearButtonStyle = {
  padding: "0 16px",
  height: 44,
  border: "1px solid #d8e0eb",
  borderRadius: 9,
  background: "#ffffff",
  color: "#071f4e",
  cursor: "pointer",
  fontWeight: 600,
};