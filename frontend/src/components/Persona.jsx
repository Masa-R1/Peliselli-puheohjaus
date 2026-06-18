import { useRive, useStateMachineInput } from "@rive-app/react-canvas";
import { useEffect, useState } from "react";
import haloRiv from "../assets/halo-2.0.riv";

export default function Persona({ state = "idle" }) {
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => {
      cancelAnimationFrame(id);
      setReady(false);
    };
  }, []);

  const { rive, RiveComponent } = useRive(
    ready && !failed
      ? {
          src: haloRiv,
          stateMachines: "default",
          autoplay: true,
          onLoadError: () => setFailed(true),
        }
      : null,
  );

  const listeningInput = useStateMachineInput(rive, "default", "listening");
  const thinkingInput = useStateMachineInput(rive, "default", "thinking");
  const speakingInput = useStateMachineInput(rive, "default", "speaking");
  const asleepInput = useStateMachineInput(rive, "default", "asleep");

  useEffect(() => {
    if (listeningInput) listeningInput.value = state === "listening";
    if (thinkingInput) thinkingInput.value = state === "thinking";
    if (speakingInput) speakingInput.value = state === "speaking";
    if (asleepInput) asleepInput.value = state === "asleep";
  }, [state, listeningInput, thinkingInput, speakingInput, asleepInput]);

  if (failed || !ready)
    return <div style={{ width: "300px", height: "300px" }} />;

  return <RiveComponent style={{ width: "300px", height: "300px" }} />;
}
