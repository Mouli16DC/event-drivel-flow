import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, ChevronRight } from 'lucide-react';

interface Step {
  id: number;
  from: string;
  to: string;
  message: string;
  type: 'command' | 'event' | 'query' | 'response';
  delay: number;
  condition?: 'success' | 'failure';
}

const participants = [
  { id: 'client', name: 'Client', color: 'from-blue-400 to-blue-600' },
  { id: 'orderService', name: 'OrderService', color: 'from-purple-400 to-purple-600' },
  { id: 'orderAggregate', name: 'OrderAggregate', color: 'from-indigo-400 to-indigo-600' },
  { id: 'saga', name: 'Saga (Orchestrator)', color: 'from-pink-400 to-pink-600' },
  { id: 'paymentService', name: 'PaymentService', color: 'from-green-400 to-green-600' },
  { id: 'userService', name: 'UserService', color: 'from-yellow-400 to-yellow-600' },
  { id: 'paymentAggregate', name: 'PaymentAggregate', color: 'from-teal-400 to-teal-600' },
  { id: 'shipmentService', name: 'ShipmentService', color: 'from-orange-400 to-orange-600' },
  { id: 'shipmentAggregate', name: 'ShipmentAggregate', color: 'from-red-400 to-red-600' }
];

const steps: Step[] = [
  { id: 1, from: 'client', to: 'orderService', message: 'CreateOrderCommand', type: 'command', delay: 500 },
  { id: 2, from: 'orderService', to: 'orderAggregate', message: '@CommandHandler', type: 'command', delay: 300 },
  { id: 3, from: 'orderAggregate', to: 'orderAggregate', message: 'apply(OrderCreatedEvent)', type: 'event', delay: 400 },
  { id: 4, from: 'orderAggregate', to: 'saga', message: 'OrderCreatedEvent', type: 'event', delay: 500 },
  { id: 5, from: 'saga', to: 'paymentService', message: 'ValidatePaymentCommand', type: 'command', delay: 600 },
  { id: 6, from: 'paymentService', to: 'paymentAggregate', message: '@CommandHandler', type: 'command', delay: 300 },
  { id: 7, from: 'paymentAggregate', to: 'userService', message: 'GetUserPaymentDetailQuery', type: 'query', delay: 400 },
  { id: 8, from: 'userService', to: 'paymentAggregate', message: 'UserDTO', type: 'response', delay: 300 },
  { id: 9, from: 'paymentAggregate', to: 'paymentAggregate', message: 'apply(PaymentProcessedEvent)', type: 'event', delay: 400, condition: 'success' },
  { id: 10, from: 'paymentAggregate', to: 'saga', message: 'PaymentProcessedEvent', type: 'event', delay: 500, condition: 'success' },
  { id: 11, from: 'saga', to: 'shipmentService', message: 'ShipOrderCommand', type: 'command', delay: 600, condition: 'success' },
  { id: 12, from: 'shipmentService', to: 'shipmentAggregate', message: '@CommandHandler', type: 'command', delay: 300, condition: 'success' },
  { id: 13, from: 'shipmentAggregate', to: 'shipmentAggregate', message: 'apply(OrderShipEvent)', type: 'event', delay: 400, condition: 'success' },
  { id: 14, from: 'shipmentAggregate', to: 'saga', message: 'OrderShipEvent', type: 'event', delay: 500, condition: 'success' },
  { id: 15, from: 'saga', to: 'orderService', message: 'CompleteOrderCommand', type: 'command', delay: 600, condition: 'success' },
  { id: 16, from: 'orderService', to: 'orderAggregate', message: '@CommandHandler', type: 'command', delay: 300, condition: 'success' },
  { id: 17, from: 'orderAggregate', to: 'orderAggregate', message: 'apply(OrderCompletedEvent)', type: 'event', delay: 400, condition: 'success' }
];

export default function SequenceDiagram() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

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
  }, [isPlaying, currentStep]);

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

  const getMessageTypeColor = (type: string) => {
    switch (type) {
      case 'command': return 'from-blue-500 to-blue-700';
      case 'event': return 'from-purple-500 to-purple-700';
      case 'query': return 'from-green-500 to-green-700';
      case 'response': return 'from-yellow-500 to-yellow-700';
      default: return 'from-gray-500 to-gray-700';
    }
  };

  const getParticipantIndex = (id: string) => participants.findIndex(p => p.id === id);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            CQRS Event Sourcing Flow
          </h1>
          <p className="text-gray-300 text-lg">Order Processing with Saga Pattern</p>
        </div>

        {/* Controls */}
        <div className="flex justify-center mb-8">
          <div className="backdrop-blur-md bg-white/10 rounded-2xl p-4 border border-white/20 shadow-2xl">
            <div className="flex items-center gap-4">
              <button
                onClick={handlePlay}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl text-white font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                {isPlaying ? 'Pause' : currentStep >= steps.length ? 'Replay' : 'Play'}
              </button>
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 rounded-xl text-white font-medium hover:from-gray-600 hover:to-gray-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <RotateCcw size={20} />
                Reset
              </button>
              <div className="text-white/80 font-medium">
                Step {Math.min(currentStep + 1, steps.length)} of {steps.length}
              </div>
            </div>
          </div>
        </div>

        {/* Participants */}
        <div className="grid grid-cols-3 lg:grid-cols-9 gap-4 mb-12">
          {participants.map((participant, index) => (
            <div key={participant.id} className="flex flex-col items-center">
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${participant.color} backdrop-blur-md border border-white/20 shadow-2xl flex items-center justify-center mb-3 transform transition-all duration-300 hover:scale-110`}>
                <div className="w-8 h-8 bg-white/20 rounded-lg"></div>
              </div>
              <div className="text-white text-sm font-medium text-center leading-tight">
                {participant.name}
              </div>
              {/* Lifeline */}
              <div className="w-0.5 bg-gradient-to-b from-white/40 to-transparent h-96 mt-4"></div>
            </div>
          ))}
        </div>

        {/* Messages */}
        <div className="relative">
          {steps.map((step, index) => {
            const fromIndex = getParticipantIndex(step.from);
            const toIndex = getParticipantIndex(step.to);
            const isCompleted = completedSteps.includes(step.id);
            const isCurrent = currentStep === index;
            
            if (!isCompleted && !isCurrent) return null;

            const leftPos = Math.min(fromIndex, toIndex) * (100 / 9) + 5.5;
            const width = Math.abs(toIndex - fromIndex) * (100 / 9);
            const topPos = index * 60 + 20;

            return (
              <div
                key={step.id}
                className={`absolute transition-all duration-500 ${
                  isCurrent ? 'animate-pulse' : ''
                }`}
                style={{
                  left: `${leftPos}%`,
                  top: `${topPos}px`,
                  width: `${width}%`
                }}
              >
                {/* Arrow Line */}
                <div className={`h-0.5 bg-gradient-to-r ${getMessageTypeColor(step.type)} relative`}>
                  <ChevronRight 
                    className={`absolute -right-2 -top-2 text-white ${
                      fromIndex > toIndex ? 'rotate-180' : ''
                    }`} 
                    size={16} 
                  />
                </div>
                
                {/* Message Box */}
                <div className={`mt-2 backdrop-blur-md bg-white/10 rounded-lg p-3 border border-white/20 shadow-xl transform transition-all duration-300 ${
                  isCurrent ? 'scale-105 shadow-2xl' : ''
                }`}>
                  <div className="text-white text-sm font-medium mb-1">
                    {step.message}
                  </div>
                  <div className={`text-xs px-2 py-1 rounded-full bg-gradient-to-r ${getMessageTypeColor(step.type)} text-white inline-block`}>
                    {step.type}
                  </div>
                  {step.condition && (
                    <div className={`text-xs px-2 py-1 rounded-full ml-2 inline-block ${
                      step.condition === 'success' 
                        ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                        : 'bg-red-500/20 text-red-300 border border-red-500/30'
                    }`}>
                      {step.condition}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-24 flex justify-center">
          <div className="backdrop-blur-md bg-white/10 rounded-2xl p-6 border border-white/20 shadow-2xl">
            <h3 className="text-white font-semibold mb-4 text-center">Message Types</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { type: 'command', label: 'Command', color: 'from-blue-500 to-blue-700' },
                { type: 'event', label: 'Event', color: 'from-purple-500 to-purple-700' },
                { type: 'query', label: 'Query', color: 'from-green-500 to-green-700' },
                { type: 'response', label: 'Response', color: 'from-yellow-500 to-yellow-700' }
              ].map(({ type, label, color }) => (
                <div key={type} className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded bg-gradient-to-r ${color}`}></div>
                  <span className="text-white/80 text-sm">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}