import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { X, ShieldCheck, Clock, CheckCircle2, Copy, Check, ArrowRight, QrCode } from "lucide-react";

export default function QRPaymentModal({ isOpen, onClose, amount = 0, itemsCount = 1, onPaymentSuccess }) {
  const [timeLeft, setTimeLeft] = useState(299); // 4 minutes 59 seconds
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);

  const mockUpiId = "hypercon.store@upi";
  const upiPayload = `upi://pay?pa=${mockUpiId}&pn=HyperCon%20Verified%20Store&am=${amount}&cu=INR&tn=Order%20Verification`;

  useEffect(() => {
    if (!isOpen) return;
    setTimeLeft(299);
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(mockUpiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleTriggerPaymentComplete = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      onPaymentSuccess();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 bg-ink/70 backdrop-blur-none z-50 flex items-center justify-center p-4">
      <div className="bg-surface text-ink w-full max-w-md border-3 border-ink shadow-brutal-lg rounded-xl overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="p-4 border-b-3 border-ink bg-base flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-ink text-surface flex items-center justify-center border-2 border-ink shadow-brutal-sm font-bold">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold font-display text-ink text-base">Scan to Pay (Demo UPI)</h3>
              <p className="text-[11px] text-ink/70 font-medium">Verify & Complete HyperCon Order</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded bg-surface border-2 border-ink hover:bg-base text-ink shadow-brutal-sm cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* QR Code Container */}
        <div className="p-6 text-center space-y-4 bg-surface">
          
          {/* Amount Badge */}
          <div className="inline-block p-3 bg-base border-3 border-ink rounded-lg shadow-brutal-sm space-y-0.5">
            <p className="text-[11px] font-bold font-display uppercase tracking-wider text-ink/60">Total Payable Amount</p>
            <p className="text-3xl font-extrabold font-display text-accent">₹{amount}</p>
            <p className="text-[10px] font-medium text-ink/70">{itemsCount} verified item(s) in order</p>
          </div>

          {/* QR Code Frame - Neobrutalism Style */}
          <div className="relative w-52 h-52 mx-auto p-4 bg-white border-3 border-ink rounded-lg shadow-brutal flex items-center justify-center">
            <QRCodeSVG
              value={upiPayload}
              size={170}
              level="H"
              includeMargin={false}
              fgColor="#1A1A1A"
              bgColor="#FFFFFF"
            />
            {/* Center Logo Icon */}
            <div className="absolute w-8 h-8 rounded bg-accent text-surface border-2 border-ink flex items-center justify-center shadow-brutal-sm font-bold text-xs">
              HC
            </div>
          </div>

          {/* Timer & UPI Details */}
          <div className="space-y-2 max-w-xs mx-auto text-xs">
            <div className="flex items-center justify-between p-2 rounded-lg bg-base border-2 border-ink">
              <span className="text-ink/70 font-medium">QR Code Expiry:</span>
              <span className="font-extrabold font-display text-accent flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {formattedTime}
              </span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-base border-2 border-ink font-mono text-[11px]">
              <span className="text-ink/60 truncate mr-2">UPI: {mockUpiId}</span>
              <button
                onClick={handleCopyUpi}
                className="px-2 py-0.5 bg-surface border border-ink rounded text-ink font-bold flex items-center gap-1 shrink-0 hover:bg-accentSoft"
              >
                {copiedUpi ? <Check className="w-3 h-3 text-accent" /> : <Copy className="w-3 h-3" />}
                <span>{copiedUpi ? "Copied" : "Copy"}</span>
              </button>
            </div>
          </div>

          {/* Demo Trigger Action */}
          <div className="pt-2 border-t-2 border-ink/10 space-y-2">
            <button
              onClick={handleTriggerPaymentComplete}
              disabled={isProcessing}
              className="w-full py-3 px-4 bg-accent hover:bg-accent/90 text-surface font-extrabold font-display text-xs rounded-lg border-3 border-ink shadow-brutal active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-surface border-t-transparent rounded-full animate-spin"></div>
                  <span>Confirming Bank Payment...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simulate Payment Received</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-1 text-[11px] text-ink/60 font-medium pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-accent" />
              <span>Demo payment gateway — no real transaction will occur</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
