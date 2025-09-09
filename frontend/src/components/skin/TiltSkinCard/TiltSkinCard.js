import React, { useEffect, useRef, useCallback, useMemo, useState } from "react";
import './TiltSkinCard.css';
import HoverTooltip from '../../ui/HoverTooltip/HoverTooltip';
import FloatBar from '../FloatBar/FloatBar';

const DEFAULT_BEHIND_GRADIENT = "radial-gradient(farthest-side circle at var(--pointer-x) var(--pointer-y), hsla(170, 100%, 75%, var(--card-opacity)) 4%, hsla(120, 100%, 70%, calc(var(--card-opacity) * 0.75)) 10%, hsla(210, 70%, 50%, calc(var(--card-opacity) * 0.5)) 50%, transparent 100%)";
const DEFAULT_INNER_GRADIENT = "linear-gradient(145deg, rgba(10, 30, 60, 0.8), rgba(80, 200, 120, 0.1))";
const ICON_URL = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' class='lucide lucide-swords'%3E%3Cpath d='m21.17 3.83-7.5 7.5.1.1a2.12 2.12 0 0 1 0 3l-2.22 2.22a2.12 2.12 0 0 1-3 0L3.83 21.17'/%3E%3Cpath d='m17.66 7.34 2.5 2.5.1.1a2.12 2.12 0 0 1 0 3l-2.22 2.22a2.12 2.12 0 0 1-3 0l-5-5a2.12 2.12 0 0 1 0-3l2.22-2.22a2.12 2.12 0 0 1 3 0l2.5 2.5'/%3E%3Cpath d='M19 5 22 2'/%3E%3Cpath d='m5 19-3 3'/%3E%3C/svg%3E";

const ANIMATION_CONFIG = { SMOOTH_DURATION: 600, INITIAL_DURATION: 1500, INITIAL_X_OFFSET: 70, INITIAL_Y_OFFSET: 60 };
const clamp = (value, min = 0, max = 100) => Math.min(Math.max(value, min), max);
const round = (value, precision = 3) => parseFloat(value.toFixed(precision));
const adjust = (value, fromMin, fromMax, toMin, toMax) => round(toMin + ((toMax - toMin) * (value - fromMin)) / (fromMax - fromMin));
const easeInOutCubic = (x) => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;

const TiltSkinCardComponent = ({ listing, inspectedData }) => {
    const wrapRef = useRef(null);
    const cardRef = useRef(null);
    const enableTilt = true;
    const item = inspectedData[listing.listingid];
    
    const [mouseMoveNonce, setMouseMoveNonce] = useState(0);

    const animationHandlers = useMemo(() => {
        if (!enableTilt) return null;
        let rafId = null;
        const updateCardTransform = (offsetX, offsetY, card, wrap) => {
            if (!card || !wrap) return;
            const { clientWidth: width, clientHeight: height } = card;
            const percentX = clamp((100 / width) * offsetX);
            const percentY = clamp((100 / height) * offsetY);
            const centerX = percentX - 50;
            const centerY = percentY - 50;
            const properties = {
                "--pointer-x": `${percentX}%`, "--pointer-y": `${percentY}%`,
                "--background-x": `${adjust(percentX, 0, 100, 35, 65)}%`, "--background-y": `${adjust(percentY, 0, 100, 35, 65)}%`,
                "--pointer-from-center": `${clamp(Math.hypot(centerY, centerX) / 50, 0, 1)}`,
                "--rotate-x": `${round(-(centerX / 5))}deg`, "--rotate-y": `${round(centerY / 4)}deg`,
            };
            Object.entries(properties).forEach(([p, v]) => wrap.style.setProperty(p, v));
        };
        const createSmoothAnimation = (duration, startX, startY, card, wrap) => {
            if (!card || !wrap) return;
            const startTime = performance.now();
            const targetX = wrap.clientWidth / 2;
            const targetY = wrap.clientHeight / 2;
            const animationLoop = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = clamp(elapsed / duration);
                const easedProgress = easeInOutCubic(progress);
                const currentX = adjust(easedProgress, 0, 1, startX, targetX);
                const currentY = adjust(easedProgress, 0, 1, startY, targetY);
                updateCardTransform(currentX, currentY, card, wrap);
                if (progress < 1) rafId = requestAnimationFrame(animationLoop);
            };
            rafId = requestAnimationFrame(animationLoop);
        };
        return { updateCardTransform, createSmoothAnimation, cancelAnimation: () => { if (rafId) cancelAnimationFrame(rafId); rafId = null; } };
    }, [enableTilt]);

    const handlePointerMove = useCallback((event) => {
        const card = cardRef.current;
        const wrap = wrapRef.current;
        if (!card || !wrap || !animationHandlers) return;
        const rect = card.getBoundingClientRect();
        animationHandlers.updateCardTransform(event.clientX - rect.left, event.clientY - rect.top, card, wrap);
        setMouseMoveNonce(n => n + 1);
    }, [animationHandlers]);

    const handlePointerEnter = useCallback(() => {
        const card = cardRef.current;
        const wrap = wrapRef.current;
        if (!card || !wrap || !animationHandlers) return;
        animationHandlers.cancelAnimation();
        wrap.classList.add("active");
        card.classList.add("active");
    }, [animationHandlers]);

    const handlePointerLeave = useCallback((event) => {
        const card = cardRef.current;
        const wrap = wrapRef.current;
        if (!card || !wrap || !animationHandlers) return;
        animationHandlers.createSmoothAnimation(ANIMATION_CONFIG.SMOOTH_DURATION, event.offsetX, event.offsetY, card, wrap);
        wrap.classList.remove("active");
        card.classList.remove("active");
    }, [animationHandlers]);

    useEffect(() => {
        if (!enableTilt || !animationHandlers) return;
        const card = cardRef.current;
        const wrap = wrapRef.current;
        if (!card || !wrap || wrap.clientWidth === 0) return;

        card.addEventListener("pointerenter", handlePointerEnter);
        card.addEventListener("pointermove", handlePointerMove);
        card.addEventListener("pointerleave", handlePointerLeave);

        const initialX = wrap.clientWidth - ANIMATION_CONFIG.INITIAL_X_OFFSET;
        const initialY = ANIMATION_CONFIG.INITIAL_Y_OFFSET;
        animationHandlers.updateCardTransform(initialX, initialY, card, wrap);
        animationHandlers.createSmoothAnimation(ANIMATION_CONFIG.INITIAL_DURATION, initialX, initialY, card, wrap);

        return () => {
            card.removeEventListener("pointerenter", handlePointerEnter);
            card.removeEventListener("pointermove", handlePointerMove);
            card.removeEventListener("pointerleave", handlePointerLeave);
            animationHandlers.cancelAnimation();
        };
    }, [enableTilt, animationHandlers, handlePointerMove, handlePointerEnter, handlePointerLeave, item]);
    
    const handleBuyClick = useCallback(async () => {
        if (!item) return;
        try {
            const marketHashName = listing.raw?.market_hash_name || item.full_item_name;
            const listingPageUrl = `https://steamcommunity.com/market/listings/730/${encodeURIComponent(marketHashName)}`;
            const { subtotalCents, feeCents, totalCents, currency } = listing.buy || {};
            if (![subtotalCents, feeCents, totalCents, currency].every(Number.isInteger)) {
                alert("Dados de compra inválidos."); return;
            }
            const res = await fetch('http://localhost:3001/api/tokens/buy', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    steamUrl: listingPageUrl, listingId: listing.listingid,
                    maxPriceCents: totalCents, itemName: item.item_name,
                }),
            });
            const data = await res.json();
            if (!res.ok || !data.token) { alert('Erro ao gerar token de compra.'); return; }
            window.postMessage({
                type: 'SS_BUY_REQUEST', steamUrl: listingPageUrl, listingId: listing.listingid,
                expectedPrice: totalCents / 100, itemName: item.item_name, token: data.token,
                subtotalCents, feeCents, totalCents, currency
            }, window.origin);
        } catch (err) { console.error('Erro no handleBuyClick:', err); alert('Falha ao processar compra.'); }
    }, [listing, item]);

    const cardStyle = useMemo(() => ({
        "--behind-gradient": DEFAULT_BEHIND_GRADIENT,
        "--inner-gradient": DEFAULT_INNER_GRADIENT,
        "--icon": `url(${ICON_URL})`,
    }), []);
    
    if (!item) return null;

    const { floatvalue, paintseed, full_item_name, imageurl } = item;
    const { stickers, keychains } = listing;
    const highResImageUrl = (imageurl || listing.image).replace('360fx360f', '512fx512f');
    const formattedPrice = (listing.priceNumber || 0).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' });

    return (
        <div ref={wrapRef} className="tsc-card-wrapper" style={cardStyle}>
            <section ref={cardRef} className="tsc-card">
                <div className="tsc-inside">
                    <div className="tsc-shine" />
                    <div className="tsc-glare" />

                    <div className="tsc-content tsc-header">
                        <h3>{full_item_name}</h3>
                    </div>

                    <div className="tsc-price-display">
                        {formattedPrice}
                    </div>

                    <div className="tsc-content tsc-avatar-content">
                        <img className="avatar" src={highResImageUrl} alt={full_item_name} />
                    </div>
                    
                    <div className="tsc-attachments">
                        <div className="tsc-stickers-wrapper">
                            {stickers && stickers.length > 0 && stickers.map((stickerUrl, i) => {
                                const stickerInfo = item.stickers?.[i];
                                const lines = [
                                    `${(stickerInfo?.wear * 100 || 0).toFixed(1)}% Wear`,
                                    `Slot ${stickerInfo?.slot + 1 || i + 1}`
                                ];
                                return (
                                    <HoverTooltip
                                        key={i}
                                        title={stickerInfo?.name || 'Sticker'}
                                        imageUrl={stickerUrl}
                                        lines={lines}
                                        mouseMoveNonce={mouseMoveNonce}
                                    >
                                        <img src={stickerUrl} alt={stickerInfo?.name || ''} className="tsc-sticker-image" />
                                    </HoverTooltip>
                                );
                            })}
                        </div>
                        <div className="tsc-charms-wrapper">
                            {keychains && keychains.length > 0 && keychains.map((keychain, index) => (
                                <HoverTooltip
                                    key={index}
                                    imageUrl={keychain.image_url}
                                    title={item.keychains?.[index]?.name || 'Charm'}
                                    mouseMoveNonce={mouseMoveNonce}
                                >
                                    <div className="tsc-charm-container">
                                        <img src={keychain.image_url} alt={`Charm ${index}`} className="tsc-charm-image" />
                                    </div>
                                </HoverTooltip>
                            ))}
                        </div>
                    </div>

                    <div className="tsc-info-bar">
                        <FloatBar floatValue={floatvalue} paintSeed={paintseed} />
                        <div className="tsc-action-buttons">
                            <button className="tsc-action-btn inspect-btn" onClick={() => window.open(listing.inspectLink, '_blank')} style={{ pointerEvents: "auto" }}>Inspecionar</button>
                            <button className="tsc-action-btn buy-btn" onClick={handleBuyClick} style={{ pointerEvents: "auto" }}>Comprar</button>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

const TiltSkinCard = React.memo(TiltSkinCardComponent);
export default TiltSkinCard;