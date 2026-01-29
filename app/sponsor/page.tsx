// @ts-nocheck
"use client";

import { useState } from "react";

const NAVY = "#0b2343";
const BLUE = "#1e63f3";
const SOFT = "#f5f7fc";

export default function SponsorPage() {
  const [step, setStep] = useState<"info" | "form" | "done">("info");

  const [bizName, setBizName] = useState("");
  const [city, setCity] = useState("New Haven, CT");
  const [category, setCategory] = useState("Money");
  const [question, setQuestion] = useState("");
  const [choiceA, setChoiceA] = useState("");
  const [choiceB, setChoiceB] = useState("");
  const [choiceC, setChoiceC] = useState("");
  const [choiceD, setChoiceD] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Later: send to Supabase / API
    console.log({
      bizName,
      city,
      category,
      question,
      choices: [choiceA, choiceB, choiceC, choiceD],
    });

    setStep("done");
  };

  return (
    <main
      style={{
        padding: "80px 24px 40px",
        maxWidth: 960,
        margin: "0 auto",
        fontFamily: "system-ui",
        background: SOFT,
        color: NAVY,
      }}
    >
      {step === "info" && <Intro onGetStarted={() => setStep("form")} />}

      {step === "form" && (
        <FormStep
          bizName={bizName}
          setBizName={setBizName}
          city={city}
          setCity={setCity}
          category={category}
          setCategory={setCategory}
          question={question}
          setQuestion={setQuestion}
          choiceA={choiceA}
          setChoiceA={setChoiceA}
          choiceB={choiceB}
          setChoiceB={setChoiceB}
          choiceC={choiceC}
          setChoiceC={setChoiceC}
          choiceD={choiceD}
          setChoiceD={setChoiceD}
          onSubmit={handleSubmit}
        />
      )}

      {step === "done" && (
        <DoneStep
          city={city}
          bizName={bizName}
        />
      )}
    </main>
  );
}

function Intro({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <>
      <h1
        style={{
          fontSize: 36,
          fontWeight: 800,
          letterSpacing: -0.4,
          marginBottom: 12,
        }}
      >
        Sponsored Vertical Placement
      </h1>

      <p
        style={{
          fontSize: 15,
          lineHeight: 1.6,
          color: "#444",
          marginBottom: 12,
          maxWidth: 720,
        }}
      >
        Businesses can sponsor a category for their city. This places their
        Quandr3 at the top of the local feed for one full week. If they get{" "}
        <strong>50 signups</strong>, they earn another week free.
      </p>

      <p
        style={{
          fontSize: 14,
          lineHeight: 1.6,
          color: "#444",
          marginBottom: 18,
          maxWidth: 720,
        }}
      >
        A Sponsored Vertical works just like any other Quandr3: you ask{" "}
        <strong>one clear question</strong> and offer{" "}
        <strong>four choices</strong> for people to vote on. We&apos;ll also
        give you a simple <strongresults>results panel</strongresults> where you
        can review votes and written responses from your customers.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 14,
          marginBottom: 28,
        }}
      >
        <InfoTile
          title="Top spot in your city"
          body="Your Business Quandr3 holds the #1 position in your category on the local feed for 7 days."
        />
        <InfoTile
          title="Four choice, real feedback"
          body="You choose the question and four options. Your customers vote and explain their 'why.'"
        />
        <InfoTile
          title="Simple results panel"
          body="We’ll give you a clean panel that shows votes, comments, and basic performance for your Quandr3."
        />
      </div>

      <button
        onClick={onGetStarted}
        style={{
          background: BLUE,
          color: "#fff",
          padding: "12px 22px",
          fontWeight: 700,
          borderRadius: 10,
          border: "none",
          cursor: "pointer",
          fontSize: 15,
          boxShadow: "0 14px 32px rgba(15,23,42,0.35)",
        }}
      >
        Get Started
      </button>
    </>
  );
}

function FormStep(props: any) {
  const {
    bizName,
    setBizName,
    city,
    setCity,
    category,
    setCategory,
    question,
    setQuestion,
    choiceA,
    setChoiceA,
    choiceB,
    setChoiceB,
    choiceC,
    setChoiceC,
    choiceD,
    setChoiceD,
    onSubmit,
  } = props;

  return (
    <section style={{ marginTop: 8 }}>
      <h2
        style={{
          fontSize: 28,
          fontWeight: 800,
          marginBottom: 6,
        }}
      >
        Submit your Sponsored Quandr3
      </h2>
      <p
        style={{
          fontSize: 14,
          color: "#444",
          marginBottom: 18,
          maxWidth: 720,
          lineHeight: 1.6,
        }}
      >
        Tell us about your business, your city, and the decision you want people
        to help you think through. Remember: one question, four choices.
      </p>

      <form onSubmit={onSubmit}>
        {/* Business Name */}
        <Label>Business name</Label>
        <Input
          value={bizName}
          onChange={(e) => setBizName(e.target.value)}
          placeholder="Ex: Bella's Pizzeria"
          required
        />

        {/* City */}
        <Label>City</Label>
        <Input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Ex: New Haven, CT"
          required
        />

        {/* Category */}
        <Label>Category you want to sponsor</Label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          required
          style={{
            width: "100%",
            borderRadius: 10,
            border: "1px solid rgba(15,23,42,0.12)",
            padding: "10px 11px",
            fontSize: 14,
            marginBottom: 18,
            outline: "none",
            cursor: "pointer",
            background: "#fff",
          }}
        >
          <option value="Money">Money</option>
          <option value="Relationships">Relationships</option>
          <option value="Career">Career</option>
          <option value="Style">Style</option>
          <option value="Lifestyle">Lifestyle</option>
          <option value="Health">Health</option>
          <option value="Business">Business</option>
          <option value="Other">Other</option>
        </select>

        {/* Question */}
        <Label>Your Business Quandr3 question</Label>
        <textarea
          rows={3}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ex: We're debating our new Saturday hours. Which opening time would work best for you?"
          required
          style={{
            width: "100%",
            borderRadius: 10,
            border: "1px solid rgba(15,23,42,0.12)",
            padding: "10px 11px",
            fontSize: 14,
            marginBottom: 18,
            outline: "none",
            resize: "vertical",
          }}
        />

        <p
          style={{
            fontSize: 12,
            color: "#555",
            marginBottom: 8,
          }}
        >
          Add four options people can vote on. Keep them short and clear. Example:
          &nbsp;&quot;Open at 7am&quot;, &quot;Open at 8am&quot;, &quot;Keep 9am&quot;, &quot;Only open later&quot;.
        </p>

        {/* Choices A–D */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 12,
            marginBottom: 10,
          }}
        >
          <ChoiceField
            label="Choice A"
            value={choiceA}
            onChange={(e) => setChoiceA(e.target.value)}
            placeholder="Ex: Open at 7am"
          />
          <ChoiceField
            label="Choice B"
            value={choiceB}
            onChange={(e) => setChoiceB(e.target.value)}
            placeholder="Ex: Open at 8am"
          />
          <ChoiceField
            label="Choice C"
            value={choiceC}
            onChange={(e) => setChoiceC(e.target.value)}
            placeholder="Ex: Keep 9am"
          />
          <ChoiceField
            label="Choice D"
            value={choiceD}
            onChange={(e) => setChoiceD(e.target.value)}
            placeholder="Ex: Only open later"
          />
        </div>

        <p
          style={{
            fontSize: 11,
            color: "#777",
            marginBottom: 18,
          }}
        >
          We&apos;ll format these as the four clickable options on your Business
          Quandr3.
        </p>

        <button
          type="submit"
          style={{
            background: BLUE,
            color: "#fff",
            padding: "12px 22px",
            fontWeight: 700,
            borderRadius: 10,
            border: "none",
            cursor: "pointer",
            fontSize: 15,
            boxShadow: "0 14px 32px rgba(15,23,42,0.35)",
          }}
        >
          Submit Sponsored Quandr3
        </button>
      </form>
    </section>
  );
}

function DoneStep({ city, bizName }: { city: string; bizName: string }) {
  return (
    <section>
      <h2
        style={{
          fontSize: 28,
          fontWeight: 800,
          marginBottom: 8,
        }}
      >
        Thanks, you&apos;re in.
      </h2>
      <p
        style={{
          fontSize: 15,
          color: "#444",
          lineHeight: 1.6,
          maxWidth: 640,
        }}
      >
        We&apos;ll review your Sponsored Quandr3 for{" "}
        <strong>{bizName || "your business"}</strong> in{" "}
        <strong>{city}</strong> and follow up with next steps. When your
        placement goes live, you&apos;ll get a simple results panel where you
        can track votes, see written responses, and measure how your question is
        performing on the local feed.
      </p>
    </section>
  );
}

/* small helpers */

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label
      style={{
        fontSize: 13,
        fontWeight: 700,
        display: "block",
        marginBottom: 6,
      }}
    >
      {children}
    </label>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      style={{
        width: "100%",
        borderRadius: 10,
        border: "1px solid rgba(15,23,42,0.12)",
        padding: "10px 11px",
        fontSize: 14,
        marginBottom: 18,
        outline: "none",
        ...(props.style || {}),
      }}
    />
  );
}

function ChoiceField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: 0.4,
          display: "block",
          marginBottom: 4,
          color: "#333",
        }}
      >
        {label}
      </span>
      <input
        type="text"
        value={value}
        onChange={onChange}
        required
        placeholder={placeholder}
        style={{
          width: "100%",
          borderRadius: 10,
          border: "1px solid rgba(15,23,42,0.12)",
          padding: "9px 10px",
          fontSize: 13,
          outline: "none",
        }}
      />
    </div>
  );
}

function InfoTile({ title, body }: { title: string; body: string }) {
  return (
    <div
      style={{
        borderRadius: 16,
        padding: 12,
        background: "#ffffff",
        boxShadow: "0 12px 30px rgba(15,23,42,0.12)",
        border: "1px solid rgba(11,35,67,0.04)",
      }}
    >
      <div
        style={{
          fontSize: 13,
          fontWeight: 800,
          marginBottom: 4,
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: 12,
          color: "#444",
          lineHeight: 1.6,
        }}
      >
        {body}
      </div>
    </div>
  );
}
