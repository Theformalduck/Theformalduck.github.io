-- Prevent duplicate fulfillment of the same Stripe checkout / payment.
-- CreateIndex
CREATE UNIQUE INDEX "orders_stripeSessionId_key" ON "orders"("stripeSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "backers_stripePaymentId_key" ON "backers"("stripePaymentId");
