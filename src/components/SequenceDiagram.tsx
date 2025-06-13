import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, AlertTriangle, CheckCircle } from 'lucide-react';

interface Step {
  id: number;
  from: string;
  to: string;
  message: string;
  type: 'command' | 'event' | 'query' | 'response';
  delay: number;
  condition?: 'success' | 'failure' | 'normal';
  description?: string;
}

const participants = [
  { id: 'client', name: 'Client', color: 'bg-blue-500', shortName: 'C' },
  { id: 'orderService', name: 'OrderService', color: 'bg-purple-500', shortName: 'OS' },
  { id: 'orderAggregate', name: 'OrderAggregate', color: 'bg-indigo-500', shortName: 'OA' },
  { id: 'saga', name: 'Saga (Orchestrator)', color: 'bg-pink-500', shortName: 'S' },
  { id: 'paymentService', name: 'PaymentService', color: 'bg-green-500', shortName: 'PS' },
  { id: 'userService', name: 'UserService', color: 'bg-yellow-500', shortName: 'US' },
  { id: 'paymentAggregate', name: 'PaymentAggregate', color: 'bg-teal-500', shortName: 'PA' },
  { id: 'shipmentService', name: 'ShipmentService', color: 'bg-orange-500', shortName: 'SS' },
  { id: 'shipmentAggregate', name: 'ShipmentAggregate', color: 'bg-red-500', shortName: 'SA' }
];

// SUCCESS FLOW - Complete order processing
const successSteps: Step[] = [
  { id: 1, from: 'client', to: 'orderService', message: 'CommandGateway.send(CreateOrderCommand)', type: 'command', delay: 800, condition: 'normal' },
  { id: 2, from: 'orderService', to: 'orderAggregate', message: '@CommandHandler', type: 'command', delay: 500, condition: 'normal' },
  { id: 3, from: 'orderAggregate', to: 'orderAggregate', message: 'apply(OrderCreatedEvent)', type: 'event', delay: 600, condition: 'normal' },
  { id: 4, from: 'orderAggregate', to: 'saga', message: 'EventBus.publish(OrderCreatedEvent)', type: 'event', delay: 700, condition: 'normal' },
  { id: 5, from: 'saga', to: 'paymentService', message: 'CommandGateway.send(ValidatePaymentCommand)', type: 'command', delay: 800, condition: 'normal' },
  { id: 6, from: 'paymentService', to: 'paymentAggregate', message: '@CommandHandler', type: 'command', delay: 500, condition: 'normal' },
  { id: 7, from: 'paymentAggregate', to: 'userService', message: 'QueryGateway.query(GetUserPaymentDetailQuery)', type: 'query', delay: 600, condition: 'normal' },
  { id: 8, from: 'userService', to: 'paymentAggregate', message: 'UserDTO', type: 'response', delay: 500, condition: 'normal' },
  { id: 9, from: 'paymentAggregate', to: 'paymentAggregate', message: 'apply(PaymentProcessedEvent)', type: 'event', delay: 600, condition: 'success' },
  { id: 10, from: 'paymentAggregate', to: 'saga', message: 'EventBus.publish(PaymentProcessedEvent)', type: 'event', delay: 700, condition: 'success' },
  { id: 11, from: 'saga', to: 'shipmentService', message: 'CommandGateway.send(ShipOrderCommand)', type: 'command', delay: 800, condition: 'success' },
  { id: 12, from: 'shipmentService', to: 'shipmentAggregate', message: '@CommandHandler', type: 'command', delay: 500, condition: 'success' },
  { id: 13, from: 'shipmentAggregate', to: 'shipmentAggregate', message: 'apply(OrderShipEvent)', type: 'event', delay: 600, condition: 'success' },
  { id: 14, from: 'shipmentAggregate', to: 'saga', message: 'EventBus.publish(OrderShipEvent)', type: 'event', delay: 700, condition: 'success' },
  { id: 15, from: 'saga', to: 'orderService', message: 'CommandGateway.send(CompleteOrderCommand)', type: 'command', delay: 800, condition: 'success' },
  { id: 16, from: 'orderService', to: 'orderAggregate', message: '@CommandHandler', type: 'command', delay: 500, condition: 'success' },
  { id: 17, from: 'orderAggregate', to: 'orderAggregate', message: 'apply(OrderCompletedEvent)', type: 'event', delay: 600, condition: 'success' }
];

// PAYMENT FAILURE FLOW - Payment validation fails
const paymentFailureSteps: Step[] = [
  { id: 1, from: 'client', to: 'orderService', message: 'CommandGateway.send(CreateOrderCommand)', type: 'command', delay: 800, condition: 'normal' },
  { id: 2, from: 'orderService', to: 'orderAggregate', message: '@CommandHandler', type: 'command', delay: 500, condition: 'normal' },
  { id: 3, from: 'orderAggregate', to: 'orderAggregate', message: 'apply(OrderCreatedEvent)', type: 'event', delay: 600, condition: 'normal' },
  { id: 4, from: 'orderAggregate', to: 'saga', message: 'EventBus.publish(OrderCreatedEvent)', type: 'event', delay: 700, condition: 'normal' },
  { id: 5, from: 'saga', to: 'paymentService', message: 'CommandGateway.send(ValidatePaymentCommand)', type: 'command', delay: 800, condition: 'normal' },
  { id: 6, from: 'paymentService', to: 'paymentAggregate', message: '@CommandHandler', type: 'command', delay: 500, condition: 'normal' },
  { id: 7, from: 'paymentAggregate', to: 'userService', message: 'QueryGateway.query(GetUserPaymentDetailQuery)', type: 'query', delay: 600, condition: 'normal' },
  { id: 8, from: 'userService', to: 'paymentAggregate', message: 'UserDTO', type: 'response', delay: 500, condition: 'normal' },
  { id: 9, from: 'paymentAggregate', to: 'paymentAggregate', message: 'apply(PaymentCancelledEvent)', type: 'event', delay: 600, condition: 'failure' },
  { id: 10, from: 'paymentAggregate', to: 'saga', message: 'EventBus.publish(PaymentCancelledEvent)', type: 'event', delay: 700, condition: 'failure' },
  { id: 11, from: 'saga', to: 'orderService', message: 'CommandGateway.send(CancelOrderCommand)', type: 'command', delay: 800, condition: 'failure' },
  { id: 12, from: 'orderService', to: 'orderAggregate', message: '@CommandHandler', type: 'command', delay: 500, condition: 'failure' },
  { id: 13, from: 'orderAggregate', to: 'orderAggregate', message: 'apply(OrderCancelledEvent)', type: 'event', delay: 600, condition: 'failure' }
];

// SHIPMENT FAILURE FLOW - Payment succeeds but shipment fails, requires compensation
const shipmentFailureSteps: Step[] = [
  { id: 1, from: 'client', to: 'orderService', message: 'CommandGateway.send(CreateOrderCommand)', type: 'command', delay: 800, condition: 'normal' },
  { id: 2, from: 'orderService', to: 'orderAggregate', message: '@CommandHandler', type: 'command', delay: 500, condition: 'normal' },
  { id: 3, from: 'orderAggregate', to: 'orderAggregate', message: 'apply(OrderCreatedEvent)', type: 'event', delay: 600, condition: 'normal' },
  { id: 4, from: 'orderAggregate', to: 'saga', message: 'EventBus.publish(OrderCreatedEvent)', type: 'event', delay: 700, condition: 'normal' },
  { id: 5, from: 'saga', to: 'paymentService', message: 'CommandGateway.send(ValidatePaymentCommand)', type: 'command', delay: 800, condition: 'normal' },
  { id: 6, from: 'paymentService', to: 'paymentAggregate', message: '@CommandHandler', type: 'command', delay: 500, condition: 'normal' },
  { id: 7, from: 'paymentAggregate', to: 'userService', message: 'QueryGateway.query(GetUserPaymentDetailQuery)', type: 'query', delay: 600, condition: 'normal' },
  { id: 8, from: 'userService', to: 'paymentAggregate', message: 'UserDTO', type: 'response', delay: 500, condition: 'normal' },
  { id: 9, from: 'paymentAggregate', to: 'paymentAggregate', message: 'apply(PaymentProcessedEvent)', type: 'event', delay: 600, condition: 'success' },
  { id: 10, from: 'paymentAggregate', to: 'saga', message: 'EventBus.publish(PaymentProcessedEvent)', type: 'event', delay: 700, condition: 'success' },
  { id: 11, from: 'saga', to: 'shipmentService', message: 'CommandGateway.send(ShipOrderCommand)', type: 'command', delay: 800, condition: 'success' },
  { id: 12, from: 'shipmentService', to: 'shipmentAggregate', message: '@CommandHandler', type: 'command', delay: 500, condition: 'success' },
  { id: 13, from: 'shipmentAggregate', to: 'shipmentAggregate', message: 'apply(ShipmentCancelledEvent)', type: 'event', delay: 600, condition: 'failure' },
  { id: 14, from: 'shipmentAggregate', to: 'saga', message: 'EventBus.publish(ShipmentCancelledEvent)', type: 'event', delay: 700, condition: 'failure' },
  { id: 15, from: 'saga', to: 'paymentService', message: 'CommandGateway.send(CancelPaymentCommand)', type: 'command', delay: 800, condition: 'failure' },
  { id: 16, from: 'saga', to: 'orderService', message: 'CommandGateway.send(CancelOrderCommand)', type: 'command', delay: 800, condition: 'failure' },
  { id: 17, from: 'paymentService', to: 'paymentAggregate', message: '@CommandHandler', type: 'command', delay: 500, condition: 'failure' },
  { id: 18, from: 'paymentAggregate', to: 'paymentAggregate', message: 'apply(PaymentCancelledEvent)', type: 'event', delay: 600, condition: 'failure' },
  { id: 19, from: 'orderService', to: 'orderAggregate', message: '@CommandHandler', type: 'command', delay: 500, condition: 'failure' },
  { id: 20, from: 'orderAggregate', to: 'orderAggregate', message: 'apply(OrderCancelledEvent)', type: 'event', delay: 600, condition: 'failure' }
];

export default function SequenceDiagram() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [selectedFlow, setSelectedFlow] = useState<'success' | 'paymentFailure' | 'shipmentFailure'>('success');

  const getCurrentSteps = () => {
    switch (selectedFlow) {
      case 'paymentFailure': return paymentFailureSteps;
      case 'shipmentFailure': return shipmentFailureSteps;
      default: return successSteps;
    }
  };

  const steps = getCurrentSteps();

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    if (isPlaying && currentStep < steps.length) {
      timeout = setTimeout(() => {
        setCompletedSteps(prev => [...prev, steps[currentStep].id]);
        setCurrentStep(prev => prev + 1);
      }, steps[currentStep].delay);
    } else if (currentStep >= steps.length) {
      setIsPlaying(false);
    }

    return () => clearTimeout(timeout);
  }, [isPlaying, currentStep, steps]);

  const handlePlay = () => {
    if (currentStep >= steps.length) {
      handleReset();
    }
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setCurrentStep(0);
    setCompletedSteps([]);
    setIsPlaying(false);
  };

  const handleFlowChange = (flow: 'success' | 'paymentFailure' | 'shipmentFailure') => {
    setSelectedFlow(flow);
    handleReset();
  };

  const getMessageTypeColor = (type: string) => {
    switch (type) {
      case 'command': return 'bg-blue-500';
      case 'event': return 'bg-purple-500';
      case 'query': return 'bg-green-500';
      case 'response': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getConditionColor = (condition?: string) => {
    switch (condition) {
      case 'success': return 'border-green-500 bg-green-50';
      case 'failure': return 'border-red-500 bg-red-50';
      default: return 'border-gray-300 bg-white';
    }
  };

  const getParticipantIndex = (id: string) => participants.findIndex(p => p.id === id);

  const getStepOpacity = (stepIndex: number) => {
    if (completedSteps.includes(steps[stepIndex].id)) return 'opacity-100';
    if (currentStep === stepIndex) return 'opacity-100';
    return 'opacity-30';
  };

  const getStepScale = (stepIndex: number) => {
    if (currentStep === stepIndex) return 'scale-105';
    return 'scale-100';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-2 sm:p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 lg:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 mb-2 lg:mb-4">
            CQRS Event Sourcing Flow
          </h1>
          <p className="text-gray-600 text-base lg:text-lg">Order Processing with Saga Pattern</p>
        </div>

        {/* Flow Selection */}
        <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mb-6 lg:mb-8">
          <button
            onClick={() => handleFlowChange('success')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg font-medium transition-all text-sm sm:text-base ${
              selectedFlow === 'success' 
                ? 'bg-green-500 text-white shadow-lg' 
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            <CheckCircle size={16} className="sm:w-[18px] sm:h-[18px]" />
            Success Flow
          </button>
          <button
            onClick={() => handleFlowChange('paymentFailure')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg font-medium transition-all text-sm sm:text-base ${
              selectedFlow === 'paymentFailure' 
                ? 'bg-red-500 text-white shadow-lg' 
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            <AlertTriangle size={16} className="sm:w-[18px] sm:h-[18px]" />
            Payment Failure
          </button>
          <button
            onClick={() => handleFlowChange('shipmentFailure')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg font-medium transition-all text-sm sm:text-base ${
              selectedFlow === 'shipmentFailure' 
                ? 'bg-orange-500 text-white shadow-lg' 
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            <AlertTriangle size={16} className="sm:w-[18px] sm:h-[18px]" />
            Shipment Failure
          </button>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mb-6 lg:mb-8">
          <div className="bg-white rounded-lg p-3 sm:p-4 shadow-lg border border-gray-200">
            <div className="flex items-center gap-2 sm:gap-4">
              <button
                onClick={handlePlay}
                className={`flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-white font-medium transition-all shadow-md hover:shadow-lg transform hover:scale-105 text-sm sm:text-base ${
                  isPlaying ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-500 hover:bg-blue-600'
                }`}
              >
                {isPlaying ? <Pause size={16} className="sm:w-5 sm:h-5" /> : <Play size={16} className="sm:w-5 sm:h-5" />}
                {isPlaying ? 'Pause' : currentStep >= steps.length ? 'Replay' : 'Play'}
              </button>
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-gray-500 hover:bg-gray-600 rounded-lg text-white font-medium transition-all shadow-md hover:shadow-lg transform hover:scale-105 text-sm sm:text-base"
              >
                <RotateCcw size={16} className="sm:w-5 sm:h-5" />
                Reset
              </button>
              <div className="text-gray-700 font-medium text-sm sm:text-base">
                Step {Math.min(currentStep + 1, steps.length)} of {steps.length}
              </div>
            </div>
          </div>
        </div>

        {/* Participants */}
        <div className="overflow-x-auto mb-8 lg:mb-12">
          <div className="min-w-max">
            <div className="grid grid-cols-9 gap-2 sm:gap-4 lg:gap-8 mb-6 lg:mb-8">
              {participants.map((participant) => (
                <div key={participant.id} className="flex flex-col items-center min-w-0">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 rounded-lg ${participant.color} shadow-lg flex items-center justify-center mb-2 lg:mb-3 transform transition-all duration-300 hover:scale-110`}>
                    <span className="text-white font-bold text-xs sm:text-sm lg:text-base">
                      {participant.shortName}
                    </span>
                  </div>
                  <div className="text-gray-800 text-xs lg:text-sm font-medium text-center leading-tight px-1">
                    {participant.name}
                  </div>
                  {/* Lifeline */}
                  <div className="w-0.5 bg-gray-300 mt-2 lg:mt-4" style={{ height: `${steps.length * 60 + 100}px` }}></div>
                </div>
              ))}
            </div>

            {/* Messages */}
            <div className="relative">
              {steps.map((step, index) => {
                const fromIndex = getParticipantIndex(step.from);
                const toIndex = getParticipantIndex(step.to);
                
                const leftPos = Math.min(fromIndex, toIndex) * 11.11 + 5.55;
                const width = Math.abs(toIndex - fromIndex) * 11.11;
                const topPos = index * 60 + 20;
                const isReverse = fromIndex > toIndex;

                return (
                  <div
                    key={step.id}
                    className={`absolute transition-all duration-500 ${getStepOpacity(index)} ${getStepScale(index)}`}
                    style={{
                      left: `${leftPos}%`,
                      top: `${topPos}px`,
                      width: width === 0 ? '11.11%' : `${width}%`
                    }}
                  >
                    {/* Arrow Line */}
                    <div className={`h-0.5 ${getMessageTypeColor(step.type)} relative ${
                      step.from === step.to ? 'rounded-r-full' : ''
                    }`}>
                      {step.from !== step.to && (
                        <ChevronRight 
                          className={`absolute -right-2 -top-2 text-gray-700 ${
                            isReverse ? 'rotate-180 -left-2' : ''
                          }`} 
                          size={14} 
                        />
                      )}
                      {step.from === step.to && (
                        <div className="absolute -right-2 -top-2 w-3 h-3 border-2 border-gray-700 rounded-full bg-white"></div>
                      )}
                    </div>
                    
                    {/* Message Box */}
                    <div className={`mt-2 border-2 rounded-lg p-2 sm:p-3 shadow-lg transform transition-all duration-300 max-w-xs lg:max-w-sm ${
                      getConditionColor(step.condition)
                    } ${currentStep === index ? 'shadow-xl ring-2 ring-blue-300' : ''}`}>
                      <div className="text-gray-800 text-xs lg:text-sm font-medium mb-2 break-words">
                        {step.message}
                      </div>
                      <div className="flex flex-wrap gap-1 sm:gap-2">
                        <span className={`text-xs px-2 py-1 rounded-full text-white ${getMessageTypeColor(step.type)}`}>
                          {step.type}
                        </span>
                        {step.condition && step.condition !== 'normal' && (
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                            step.condition === 'success' 
                              ? 'bg-green-100 text-green-800 border border-green-300' 
                              : 'bg-red-100 text-red-800 border border-red-300'
                          }`}>
                            {step.condition}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex justify-center">
          <div className="bg-white rounded-lg p-4 sm:p-6 shadow-lg border border-gray-200 max-w-4xl w-full">
            <h3 className="text-gray-800 font-semibold mb-4 text-center text-sm sm:text-base">Message Types & Flow Patterns</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
              {[
                { type: 'command', label: 'Command', color: 'bg-blue-500' },
                { type: 'event', label: 'Event', color: 'bg-purple-500' },
                { type: 'query', label: 'Query', color: 'bg-green-500' },
                { type: 'response', label: 'Response', color: 'bg-yellow-500' }
              ].map(({ type, label, color }) => (
                <div key={type} className="flex items-center gap-2">
                  <div className={`w-3 h-3 sm:w-4 sm:h-4 rounded ${color}`}></div>
                  <span className="text-gray-700 text-xs sm:text-sm">{label}</span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <CheckCircle size={14} className="text-green-500 sm:w-4 sm:h-4" />
                <span>Success: Complete order processing</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle size={14} className="text-red-500 sm:w-4 sm:h-4" />
                <span>Payment Failure: Order cancellation</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle size={14} className="text-orange-500 sm:w-4 sm:h-4" />
                <span>Shipment Failure: Compensation flow</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}