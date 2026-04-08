"use client";

import { useEffect, useState } from "react";

export function AntiScreenshot() {
  const [isBlurred, setIsBlurred] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Tenta interceptar PrintScreen ou combinações comuns de screenshot
      if (
        e.key === "PrintScreen" ||
        (e.metaKey && e.shiftKey) // Mac combos
      ) {
        setIsBlurred(true);
        navigator.clipboard.writeText("Screenshots da Guardiã são desabilitados por segurança e privacidade.");
        setTimeout(() => setIsBlurred(false), 3000);
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsBlurred(true);
      } else {
        setIsBlurred(false);
      }
    };

    const handleBlur = () => setIsBlurred(true);
    const handleFocus = () => setIsBlurred(false);

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
          body {
            -webkit-user-select: none;
            -ms-user-select: none;
            user-select: none;
          }
          @media print {
            body {
              display: none !important;
            }
          }
        `
      }} />
      
      {isBlurred && (
        <div className="fixed inset-0 z-[9999] bg-stone-100/95 backdrop-blur-xl flex flex-col items-center justify-center text-center p-6">
          <div className="text-4xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-stone-900 mb-2">Conteúdo Protegido</h2>
          <p className="text-stone-600 max-w-md">
            Para garantir sua segurança e privacidade, a captura de tela e a visualização em segundo plano estão desativadas.
          </p>
        </div>
      )}
      
      {/* Watermark sutil - Opcional, ajuda a identificar vazamentos e inibe prints */}
      <div className="pointer-events-none fixed inset-0 z-[9998] opacity-[0.02] flex items-center justify-center overflow-hidden mix-blend-multiply">
        <div className="grid grid-cols-4 gap-20 rotate-[-15deg] scale-150">
          {Array.from({ length: 48 }).map((_, i) => (
            <span key={i} className="text-xl font-bold text-stone-900 whitespace-nowrap">
              CONFIDENCIAL • NÃO COMPARTILHE
            </span>
          ))}
        </div>
      </div>
    </>
  );
}
